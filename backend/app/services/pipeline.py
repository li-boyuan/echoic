import asyncio
import logging
import os

from app.models.schemas import ChapterInfo, JobResponse, JobStatus
from app.services.credits import consume_credit
from app.services.director import direct_text
from app.services.narrator import generate_segment_audio, stitch_audio
from app.services.parser import extract_text, split_chapters
from app.services.segmenter import (
    assign_voices,
    extract_characters,
    prepare_segment_text,
    segment_text,
)

logger = logging.getLogger(__name__)


async def run_pipeline(
    job: JobResponse, filepath: str, jobs: dict[str, JobResponse],
    user_id: str = "anonymous", credit_tier: str = "free",
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

        all_directed = []
        total_steps = len(chapters) * 2
        completed = 0

        for ch in chapters:
            logger.info(
                "Job %s: chapter %d '%s' — %d chars",
                job.id, ch.index, ch.title, len(ch.text),
            )
            directed = await direct_text(ch.text)
            logger.info(
                "Job %s: chapter %d — directed %d chars → %d chars",
                job.id, ch.index, len(ch.text), len(directed),
            )
            all_directed.append((ch, directed))
            completed += 1
            job.progress = completed / total_steps
            job.chapters[ch.index].status = "directed"
            jobs[job.id] = job

        all_text = "\n".join(d for _, d in all_directed)
        characters = extract_characters(all_text)
        voice_map = await assign_voices(characters, job.voice)
        job.cast = voice_map
        jobs[job.id] = job

        logger.info(
            "Job %s: cast %s",
            job.id,
            ", ".join(f"{c}={v}" for c, v in voice_map.items()),
        )

        job.status = JobStatus.NARRATING
        jobs[job.id] = job

        chapter_audio_paths = []
        for ch, directed in all_directed:
            segments = segment_text(directed, job.voice, voice_map)
            logger.info(
                "Job %s: chapter %d — %d segments, total %d chars",
                job.id, ch.index, len(segments),
                sum(len(s.text) for s in segments),
            )

            pcm_chunks = []
            for i, seg in enumerate(segments):
                seg_text = prepare_segment_text(seg)
                pcm = await generate_segment_audio(
                    seg_text, seg.narrator_voice, seg.character_voice,
                )
                pcm_chunks.append(pcm)
                if i < len(segments) - 1:
                    await asyncio.sleep(1.5)

            chapter_path = f"output/{job.id}/chapter_{ch.index}.wav"
            stitch_audio(pcm_chunks, chapter_path)
            chapter_audio_paths.append(chapter_path)

            completed += 1
            job.progress = completed / total_steps
            job.chapters[ch.index].status = "completed"
            job.chapters[ch.index].audio_url = f"/api/jobs/{job.id}/audio/{ch.index}"
            jobs[job.id] = job

        full_pcm = []
        for path in chapter_audio_paths:
            import wave
            with wave.open(path, "rb") as wf:
                full_pcm.append(wf.readframes(wf.getnframes()))

        full_path = f"output/{job.id}/full.wav"
        stitch_audio(full_pcm, full_path)

        consume_credit(user_id, credit_tier)

        job.status = JobStatus.COMPLETED
        job.progress = 1.0
        job.audio_url = f"/api/jobs/{job.id}/audio"
        jobs[job.id] = job

    except Exception as e:
        logger.exception("Pipeline failed for job %s", job.id)
        job.status = JobStatus.FAILED
        job.error = str(e)
        jobs[job.id] = job
