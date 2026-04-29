import asyncio
import uuid

import aiofiles
from fastapi import APIRouter, Form, HTTPException, UploadFile

from app.api.jobs import jobs
from app.config import settings
from app.models.schemas import JobResponse, JobStatus
from app.services.credits import can_convert
from app.services.narrator import AVAILABLE_VOICES
from app.services.parser import extract_text
from app.services.pipeline import run_pipeline

router = APIRouter()

ALLOWED_EXTENSIONS = {".txt", ".pdf", ".epub", ".docx", ".mobi", ".azw", ".azw3"}
VALID_VOICE_IDS = {v["id"] for v in AVAILABLE_VOICES}


@router.post("/upload", response_model=JobResponse)
async def upload_manuscript(
    file: UploadFile,
    voice: str = Form(default="Kore"),
    user_id: str = Form(default="anonymous"),
):
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type. Allowed: {ALLOWED_EXTENSIONS}")

    if voice not in VALID_VOICE_IDS:
        raise HTTPException(400, f"Unknown voice. Available: {VALID_VOICE_IDS}")

    job_id = str(uuid.uuid4())
    filepath = f"{settings.upload_dir}/{job_id}{ext}"

    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        if len(content) > settings.max_file_size_mb * 1024 * 1024:
            raise HTTPException(413, f"File exceeds {settings.max_file_size_mb}MB limit")
        await f.write(content)

    text = extract_text(filepath)
    word_count = len(text.split())

    allowed, tier = can_convert(user_id, word_count)
    if not allowed:
        import os
        os.remove(filepath)
        raise HTTPException(
            402,
            "No credits available. Purchase a Single Book or subscribe to Pro to continue.",
        )

    job = JobResponse(id=job_id, filename=file.filename, status=JobStatus.PENDING, voice=voice)
    jobs[job_id] = job

    asyncio.create_task(run_pipeline(job, filepath, jobs, user_id=user_id, credit_tier=tier))

    return job
