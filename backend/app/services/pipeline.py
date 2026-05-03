import asyncio
import logging
import os
import wave

from app.models.schemas import ChapterInfo, JobResponse, JobStatus
from app.services.credits import consume_credit
from app.services.director import direct_text
from app.services.jobstore import save_job
from app.services.narrator import generate_segment_audio, stitch_audio
from app.services.notify import send_completion_email, send_failure_email
from app.services.storage import upload_job_audio
from app.services.parser import extract_text, split_chapters
from app.services.segmenter import (
    assign_voices,
    extract_characters,
    prepare_segment_text,
    segment_text,
)

logger = logging.getLogger(__name__)


async def _narrate_chapter(job, jobs, ch, directed, voice_map, semaphore):
    async with semaphore:
        try:
            segments = segment_text(directed, job.voice, voice_map)
            logger.info(
                "Job %s: chapter %d — %d segments, total %d chars",
                job.id, ch.index, len(segments),
                sum(len(s.text) for s in segments),
            )

            pcm_chunks = []
            for seg in segments:
                seg_text = prepare_segment_text(seg)
                pcm = await generate_segment_audio(
                    seg_text, seg.narrator_voice, seg.character_voice,
                )
                pcm_chunks.append(pcm)

            chapter_path = f"output/{job.id}/chapter_{ch.index}.wav"
            stitch_audio(pcm_chunks, chapter_path)

            job.chapters[ch.index].status = "completed"
            job.chapters[ch.index].audio_url = f"/api/jobs/{job.id}/audio/{ch.index}"
            completed = sum(1 for c in job.chapters if c.status == "completed")
            job.progress = 0.5 + (completed / len(job.chapters)) * 0.5
            save_job(job.id, job); jobs[job.id] = job

            logger.info("Job %s: chapter %d completed", job.id, ch.index)
            return chapter_path
        except Exception as e:
            logger.exception("Job %s: chapter %d failed", job.id, ch.index)
            job.chapters[ch.index].status = "failed"
            save_job(job.id, job); jobs[job.id] = job
            raise


async def run_pipeline(
    job: JobResponse, filepath: str, jobs: dict[str, JobResponse],
    user_id: str = "anonymous", credit_tier: str = "free", language: str = "en",
):
    try:
        text = extract_text(filepath)
        logger.info("Job %s: extracted %d chars of text", job.id, len(text))
        chapters = split_chapters(text)

        job.chapters = [
            ChapterInfo(index=ch.index, title=ch.title)
            for ch in chapters
        ]
        job.status = JobStatus.DIRECTING
        jobs[job.id] = job

        logger.info("Job %s: %d chapters found", job.id, len(chapters))

        os.makedirs(f"output/{job.id}", exist_ok=True)

        # Direct chapters (limit concurrency to avoid Claude rate limits)
        director_sem = asyncio.Semaphore(2)

        async def direct_chapter(ch):
            async with director_sem:
                logger.info("Job %s: directing chapter %d '%s' — %d chars", job.id, ch.index, ch.title, len(ch.text))
                directed = await direct_text(ch.text, language=language)
                if ch.title and ch.title != "Full Text":
                    directed = f"Narrator: {ch.title}\n{directed}"
                logger.info("Job %s: chapter %d directed — %d chars → %d chars", job.id, ch.index, len(ch.text), len(directed))
                job.chapters[ch.index].status = "directed"
                job.progress = sum(1 for c in job.chapters if c.status != "pending") / (len(chapters) * 2)
                save_job(job.id, job); jobs[job.id] = job
                return ch, directed

        all_directed = await asyncio.gather(*[direct_chapter(ch) for ch in chapters])

        # Cast voices from all directed text
        all_text = "\n".join(d for _, d in all_directed)
        characters = extract_characters(all_text)
        voice_map = await assign_voices(characters, job.voice)
        job.cast = voice_map
        job.status = JobStatus.NARRATING
        jobs[job.id] = job

        logger.info("Job %s: cast %s", job.id, ", ".join(f"{c}={v}" for c, v in voice_map.items()))

        # Narrate all chapters in parallel (limit concurrency to 3)
        semaphore = asyncio.Semaphore(3)
        chapter_paths = await asyncio.gather(
            *[_narrate_chapter(job, jobs, ch, directed, voice_map, semaphore)
              for ch, directed in all_directed]
        )

        # Stitch full audiobook
        full_pcm = []
        for path in chapter_paths:
            with wave.open(path, "rb") as wf:
                full_pcm.append(wf.readframes(wf.getnframes()))

        full_path = f"output/{job.id}/full.wav"
        stitch_audio(full_pcm, full_path)

        consume_credit(user_id, credit_tier)

        r2_urls = upload_job_audio(job.id, "output", user_id=user_id)
        if "full" in r2_urls:
            job.r2_url = r2_urls["full"]
        for ch in job.chapters:
            ch_key = f"chapter_{ch.index}"
            if ch_key in r2_urls:
                ch.r2_url = r2_urls[ch_key]

        job.status = JobStatus.COMPLETED
        job.progress = 1.0
        job.audio_url = f"/api/jobs/{job.id}/audio"
        save_job(job.id, job); jobs[job.id] = job

        if job.user_email:
            send_completion_email(job.user_email, job.filename, job.id)

    except Exception as e:
        logger.exception("Pipeline failed for job %s", job.id)
        job.status = JobStatus.FAILED
        job.error = str(e)
        save_job(job.id, job); jobs[job.id] = job

        if job.user_email:
            send_failure_email(job.user_email, job.filename, str(e))
