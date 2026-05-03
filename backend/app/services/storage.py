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
        logger.info("Uploaded %s to R2", key)
        return key
    except Exception as e:
        logger.error("R2 upload failed for %s: %s", key, e)
        return None


def get_presigned_url(key: str, expires_in: int = 3600) -> str | None:
    if not is_configured() or not key:
        return None

    try:
        client = _get_client()
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.r2_bucket_name, "Key": key},
            ExpiresIn=expires_in,
        )
        return url
    except Exception as e:
        logger.error("Presigned URL generation failed for %s: %s", key, e)
        return None


def upload_job_audio(job_id: str, output_dir: str, user_id: str = "anonymous") -> dict[str, str]:
    urls = {}
    prefix = f"users/{user_id}/{job_id}"

    full_path = os.path.join(output_dir, job_id, "full.wav")
    if os.path.exists(full_path):
        key = upload_file(full_path, f"{prefix}/full.wav")
        if key:
            urls["full"] = key

    chapter_idx = 0
    while True:
        ch_path = os.path.join(output_dir, job_id, f"chapter_{chapter_idx}.wav")
        if not os.path.exists(ch_path):
            break
        key = upload_file(ch_path, f"{prefix}/chapter_{chapter_idx}.wav")
        if key:
            urls[f"chapter_{chapter_idx}"] = key
        chapter_idx += 1

    return urls
