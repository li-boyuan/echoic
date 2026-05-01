import asyncio
import os
import uuid
import wave

import aiofiles
from fastapi import APIRouter, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.api.jobs import jobs
from app.config import settings
from app.models.schemas import JobResponse, JobStatus
from app.services.credits import can_convert
from app.services.director import direct_text
from app.services.narrator import AVAILABLE_VOICES, generate_segment_audio, stitch_audio
from app.services.parser import extract_text
from app.services.pipeline import run_pipeline
from app.services.segmenter import prepare_segment_text, segment_text

router = APIRouter()

ALLOWED_EXTENSIONS = {".txt", ".pdf", ".epub", ".docx", ".mobi", ".azw", ".azw3"}
VALID_VOICE_IDS = {v["id"] for v in AVAILABLE_VOICES}


@router.post("/preview")
async def preview_voice(
    file: UploadFile,
    voice: str = Form(default="Kore"),
    language: str = Form(default="en"),
):
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type. Allowed: {ALLOWED_EXTENSIONS}")

    preview_id = str(uuid.uuid4())
    filepath = f"{settings.upload_dir}/preview_{preview_id}{ext}"

    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)

    try:
        text = extract_text(filepath)
        if not text or len(text.strip()) < 20:
            raise HTTPException(400, "Could not extract enough text from file for preview")
        sample = text[:500]

        directed = await direct_text(sample, language=language)

        voice_map = {"Character": "Aoede" if voice != "Aoede" else "Puck"}
        segments = segment_text(directed, voice, voice_map)

        if not segments:
            raise HTTPException(500, "Could not generate preview")

        seg = segments[0]
        seg_text = prepare_segment_text(seg)
        pcm = await generate_segment_audio(seg_text, seg.narrator_voice, seg.character_voice)

        os.makedirs(f"output/previews", exist_ok=True)
        out_path = f"output/previews/{preview_id}.wav"
        stitch_audio([pcm], out_path)

        return FileResponse(out_path, media_type="audio/wav", filename="preview.wav")
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


@router.post("/upload", response_model=JobResponse)
async def upload_manuscript(
    file: UploadFile,
    voice: str = Form(default="Kore"),
    user_id: str = Form(default="anonymous"),
    language: str = Form(default="en"),
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

    asyncio.create_task(run_pipeline(job, filepath, jobs, user_id=user_id, credit_tier=tier, language=language))

    return job
