import json
import logging
import os
import threading

from app.models.schemas import ChapterInfo, JobResponse, JobStatus

logger = logging.getLogger(__name__)

JOBS_FILE = os.environ.get("JOBS_FILE", "data/jobs.json")

_jobs: dict[str, JobResponse] = {}
_lock = threading.Lock()


def _load():
    global _jobs
    if os.path.exists(JOBS_FILE):
        with open(JOBS_FILE, "r") as f:
            data = json.load(f)
        for jid, rec in data.items():
            rec.setdefault("user_id", "anonymous")
            rec.setdefault("user_email", None)
            rec.setdefault("created_at", None)
            if "chapters" in rec:
                rec["chapters"] = [ChapterInfo(**ch) for ch in rec["chapters"]]
            _jobs[jid] = JobResponse(**rec)


def _save():
    os.makedirs(os.path.dirname(JOBS_FILE) or ".", exist_ok=True)
    tmp = JOBS_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump({jid: job.model_dump() for jid, job in _jobs.items()}, f)
    os.replace(tmp, JOBS_FILE)


_load()


def get_jobs() -> dict[str, JobResponse]:
    return _jobs


def save_job(job_id: str, job: JobResponse):
    with _lock:
        _jobs[job_id] = job
        _save()


def get_user_jobs(user_id: str) -> list[JobResponse]:
    return [j for j in _jobs.values() if j.user_id == user_id and j.status in (JobStatus.COMPLETED, JobStatus.FAILED)]
