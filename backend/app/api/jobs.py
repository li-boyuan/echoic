from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.models.schemas import JobResponse, JobStatus

router = APIRouter()

jobs: dict[str, JobResponse] = {}


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.get("/jobs/{job_id}/audio")
async def get_audio(job_id: str):
    job = jobs.get(job_id)
    if not job or job.status != JobStatus.COMPLETED:
        raise HTTPException(404, "Audio not ready")

    audio_path = Path(f"output/{job_id}.wav")
    if not audio_path.exists():
        raise HTTPException(404, "Audio file not found")

    return FileResponse(audio_path, media_type="audio/wav", filename=f"{job.filename}.wav")
