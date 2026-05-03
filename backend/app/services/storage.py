import logging
import os

from app.config import settings

logger = logging.getLogger(__name__)

_client = None


def _get_client():
    global _client
    if _client is None:
        import boto3
        _client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            region_name="auto",
        )
    return _client


def is_configured() -> bool:
    return bool(settings.r2_account_id and settings.r2_access_key_id and settings.r2_secret_access_key)


def upload_file(local_path: str, key: str) -> str | None:
    if not is_configured():
        return None

    try:
        client = _get_client()
        content_type = "audio/wav" if key.endswith(".wav") else "application/octet-stream"
        client.upload_file(
            local_path,
            settings.r2_bucket_name,
            key,
            ExtraArgs={"ContentType": content_type},
        )
        url = f"{settings.r2_public_url}/{key}" if settings.r2_public_url else None
        logger.info("Uploaded %s to R2 (%s)", key, url or "no public URL")
        return url
    except Exception as e:
        logger.error("R2 upload failed for %s: %s", key, e)
        return None


def upload_job_audio(job_id: str, output_dir: str) -> dict[str, str]:
    urls = {}

    full_path = os.path.join(output_dir, job_id, "full.wav")
    if os.path.exists(full_path):
        url = upload_file(full_path, f"jobs/{job_id}/full.wav")
        if url:
            urls["full"] = url

    chapter_idx = 0
    while True:
        ch_path = os.path.join(output_dir, job_id, f"chapter_{chapter_idx}.wav")
        if not os.path.exists(ch_path):
            break
        url = upload_file(ch_path, f"jobs/{job_id}/chapter_{chapter_idx}.wav")
        if url:
            urls[f"chapter_{chapter_idx}"] = url
        chapter_idx += 1

    return urls
