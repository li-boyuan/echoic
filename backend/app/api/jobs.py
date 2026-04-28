from fastapi import APIRouter, HTTPException

from app.models.schemas import JobResponse, JobStatus

router = APIRouter()

# In-memory store for MVP — replace with Redis/DB later
_jobs: dict[str, JobResponse] = {}


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job
