import subprocess
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, RedirectResponse

from app.models.schemas import JobResponse, JobStatus, VoiceOption
from app.services.jobstore import delete_job, get_jobs, get_user_jobs, save_job
from app.services.narrator import AVAILABLE_VOICES, LANGUAGES, generate_preview, get_voices_for_language
from app.services.storage import delete_prefix, get_presigned_url

router = APIRouter()

jobs = get_jobs()

SUPPORTED_FORMATS = {
    "wav": {"ext": ".wav", "media_type": "audio/wav"},
    "mp3": {"ext": ".mp3", "media_type": "audio/mpeg"},
    "m4a": {"ext": ".m4a", "media_type": "audio/mp4"},
    "flac": {"ext": ".flac", "media_type": "audio/flac"},
    "ogg": {"ext": ".ogg", "media_type": "audio/ogg"},
}


def _convert_audio(source: Path, target: Path, fmt: str) -> Path:
    if target.exists():
        return target

    ffmpeg_args = {
        "mp3": ["-codec:a", "libmp3lame", "-b:a", "192k"],
        "m4a": ["-codec:a", "aac", "-b:a", "192k"],
        "flac": ["-codec:a", "flac"],
        "ogg": ["-codec:a", "libvorbis", "-q:a", "6"],
    }

    args = ffmpeg_args.get(fmt, [])
    result = subprocess.run(
        ["ffmpeg", "-i", str(source), *args, "-y", str(target)],
        capture_output=True, timeout=300,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg conversion failed: {result.stderr.decode()[:200]}")
    return target


def _find_source_wav(base_dir: str, name: str) -> Path | None:
    for ext in (".wav", ".mp3"):
        p = Path(f"{base_dir}/{name}{ext}")
        if p.exists():
            return p
    return None


@router.get("/user/{user_id}/jobs")
async def list_user_jobs(user_id: str):
    return get_user_jobs(user_id)


@router.delete("/jobs/{job_id}")
async def remove_job(job_id: str, user_id: str = Query(default="")):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if job.user_id != "anonymous" and job.user_id != user_id:
        raise HTTPException(403, "Access denied")

    delete_prefix(f"users/{job.user_id}/{job_id}/")
    delete_job(job_id)
    if job_id in jobs:
        del jobs[job_id]

    return {"status": "deleted"}


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.get("/jobs/{job_id}/audio")
async def get_audio(job_id: str, format: str = Query(default="wav"), user_id: str = Query(default="")):
    job = jobs.get(job_id)
    if not job or job.status != JobStatus.COMPLETED:
        raise HTTPException(404, "Audio not ready")

    if job.user_id != "anonymous" and user_id and job.user_id != user_id:
        raise HTTPException(403, "Access denied")

    if format not in SUPPORTED_FORMATS:
        raise HTTPException(400, f"Unsupported format. Available: {list(SUPPORTED_FORMATS.keys())}")

    source = _find_source_wav(f"output/{job_id}", "full")
    if not source:
        presigned = get_presigned_url(job.r2_url)
        if presigned:
            return RedirectResponse(presigned)
        raise HTTPException(404, "Audio file not found")

    fmt = SUPPORTED_FORMATS[format]
    if format == "wav" and source.suffix == ".wav":
        return FileResponse(source, media_type=fmt["media_type"], filename=f"{job.filename}.wav")

    target = source.with_suffix(fmt["ext"])
    _convert_audio(source, target, format)
    return FileResponse(target, media_type=fmt["media_type"], filename=f"{job.filename}{fmt['ext']}")


@router.get("/jobs/{job_id}/audio/{chapter_index}")
async def get_chapter_audio(job_id: str, chapter_index: int, format: str = Query(default="wav"), user_id: str = Query(default="")):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    if job.user_id != "anonymous" and user_id and job.user_id != user_id:
        raise HTTPException(403, "Access denied")

    chapter = next((ch for ch in job.chapters if ch.index == chapter_index), None)
    if not chapter or chapter.status != "completed":
        raise HTTPException(404, "Chapter audio not ready")

    if format not in SUPPORTED_FORMATS:
        raise HTTPException(400, f"Unsupported format. Available: {list(SUPPORTED_FORMATS.keys())}")

    source = _find_source_wav(f"output/{job_id}", f"chapter_{chapter_index}")
    if not source:
        presigned = get_presigned_url(chapter.r2_url)
        if presigned:
            return RedirectResponse(presigned)
        raise HTTPException(404, "Chapter audio file not found")

    fmt = SUPPORTED_FORMATS[format]
    if format == "wav" and source.suffix == ".wav":
        return FileResponse(source, media_type=fmt["media_type"], filename=f"{job.filename} - {chapter.title}.wav")

    target = source.with_suffix(fmt["ext"])
    _convert_audio(source, target, format)
    return FileResponse(target, media_type=fmt["media_type"], filename=f"{job.filename} - {chapter.title}{fmt['ext']}")


@router.get("/formats")
async def list_formats():
    return [
        {"id": "wav", "name": "WAV", "description": "Uncompressed, highest quality"},
        {"id": "mp3", "name": "MP3", "description": "Compressed, universal compatibility"},
        {"id": "m4a", "name": "M4A", "description": "AAC audio, great for Apple devices"},
        {"id": "flac", "name": "FLAC", "description": "Lossless compression"},
        {"id": "ogg", "name": "OGG", "description": "Open format, good quality"},
    ]


@router.get("/voices")
async def list_voices(lang: str = Query(default="en")):
    voices = get_voices_for_language(lang)
    return [{"id": v["id"], "name": v["id"], "description": f"{v['gender']} — {v['description']}"} for v in voices]


@router.get("/languages")
async def list_languages():
    return LANGUAGES


@router.get("/voices/preview")
async def voice_preview(voice: str = Query(), lang: str = Query(default="en")):
    path = await generate_preview(voice, lang, "data/previews")
    if not path:
        raise HTTPException(503, "Could not generate preview — try again later")
    return FileResponse(path, media_type="audio/wav")
