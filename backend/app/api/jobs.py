from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.models.schemas import JobResponse, JobStatus, VoiceOption
from app.services.narrator import AVAILABLE_VOICES

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

    for ext in (".mp3", ".wav"):
        audio_path = Path(f"output/{job_id}/full{ext}")
        if audio_path.exists():
            media_type = "audio/mpeg" if ext == ".mp3" else "audio/wav"
            return FileResponse(audio_path, media_type=media_type, filename=f"{job.filename}{ext}")

    raise HTTPException(404, "Audio file not found")


@router.get("/jobs/{job_id}/audio/{chapter_index}")
async def get_chapter_audio(job_id: str, chapter_index: int):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    chapter = next((ch for ch in job.chapters if ch.index == chapter_index), None)
    if not chapter or chapter.status != "completed":
        raise HTTPException(404, "Chapter audio not ready")

    for ext in (".mp3", ".wav"):
        audio_path = Path(f"output/{job_id}/chapter_{chapter_index}{ext}")
        if audio_path.exists():
            media_type = "audio/mpeg" if ext == ".mp3" else "audio/wav"
            filename = f"{job.filename} - {chapter.title}{ext}"
            return FileResponse(audio_path, media_type=media_type, filename=filename)

    raise HTTPException(404, "Chapter audio file not found")


@router.get("/voices", response_model=list[VoiceOption])
async def list_voices():
    return AVAILABLE_VOICES
