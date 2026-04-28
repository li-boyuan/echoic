import uuid

import aiofiles
from fastapi import APIRouter, HTTPException, UploadFile

from app.config import settings
from app.models.schemas import JobResponse, JobStatus

router = APIRouter()

ALLOWED_EXTENSIONS = {".txt", ".pdf", ".epub", ".docx"}


@router.post("/upload", response_model=JobResponse)
async def upload_manuscript(file: UploadFile):
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type. Allowed: {ALLOWED_EXTENSIONS}")

    job_id = str(uuid.uuid4())
    filepath = f"{settings.upload_dir}/{job_id}{ext}"

    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        if len(content) > settings.max_file_size_mb * 1024 * 1024:
            raise HTTPException(413, f"File exceeds {settings.max_file_size_mb}MB limit")
        await f.write(content)

    # TODO: enqueue the director + narrator pipeline here
    return JobResponse(
        id=job_id,
        filename=file.filename,
        status=JobStatus.PENDING,
    )
