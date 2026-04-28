import logging

from app.models.schemas import JobResponse, JobStatus
from app.services.director import direct_text
from app.services.narrator import narrate_text
from app.services.parser import chunk_text, extract_text

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
            job.progress = (i + 1) / len(chunks) * 0.5
            jobs[job.id] = job

        job.status = JobStatus.NARRATING
        jobs[job.id] = job

        full_directed_text = "\n\n".join(directed_chunks)
        output_path = f"output/{job.id}.mp3"
        await narrate_text(full_directed_text, output_path, voice=job.voice)

        job.status = JobStatus.COMPLETED
        job.progress = 1.0
        job.audio_url = f"/api/jobs/{job.id}/audio"
        jobs[job.id] = job

    except Exception as e:
        logger.exception("Pipeline failed for job %s", job.id)
        job.status = JobStatus.FAILED
        job.error = str(e)
        jobs[job.id] = job
