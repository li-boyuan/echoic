import logging

from app.models.schemas import JobResponse, JobStatus
from app.services.director import direct_text
from app.services.narrator import generate_segment_audio, stitch_audio
from app.services.parser import chunk_text, extract_text
from app.services.segmenter import (
    assign_voices,
    extract_characters,
    prepare_segment_text,
    segment_text,
)

logger = logging.getLogger(__name__)


async def run_pipeline(job: JobResponse, filepath: str, jobs: dict[str, JobResponse]):
    try:
        job.status = JobStatus.DIRECTING
        jobs[job.id] = job

        text = extract_text(filepath)
        chunks = chunk_text(text)

        directed_chunks = []
        for i, chunk in enumerate(chunks):
            directed = await direct_text(chunk)
            directed_chunks.append(directed)
            job.progress = (i + 1) / len(chunks) * 0.3
            jobs[job.id] = job

        full_directed = "\n".join(directed_chunks)

        characters = extract_characters(full_directed)
        voice_map = await assign_voices(characters, job.voice)

        logger.info(
            "Job %s: found %d characters: %s",
            job.id, len(characters),
            ", ".join(f"{c}={voice_map[c]}" for c in characters),
        )

        segments = segment_text(full_directed, job.voice, voice_map)

        job.status = JobStatus.NARRATING
        jobs[job.id] = job

        pcm_chunks = []
        for i, seg in enumerate(segments):
            seg_text = prepare_segment_text(seg)
            pcm = await generate_segment_audio(
                seg_text, seg.narrator_voice, seg.character_voice,
            )
            pcm_chunks.append(pcm)
            job.progress = 0.3 + (i + 1) / len(segments) * 0.7
            jobs[job.id] = job

        output_path = f"output/{job.id}.mp3"
        stitch_audio(pcm_chunks, output_path)

        job.status = JobStatus.COMPLETED
        job.progress = 1.0
        job.audio_url = f"/api/jobs/{job.id}/audio"
        jobs[job.id] = job

    except Exception as e:
        logger.exception("Pipeline failed for job %s", job.id)
        job.status = JobStatus.FAILED
        job.error = str(e)
        jobs[job.id] = job
