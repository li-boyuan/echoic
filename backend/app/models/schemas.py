from enum import Enum

from pydantic import BaseModel


class JobStatus(str, Enum):
    PENDING = "pending"
    DIRECTING = "directing"
    NARRATING = "narrating"
    COMPLETED = "completed"
    FAILED = "failed"


class JobCreate(BaseModel):
    filename: str


class JobResponse(BaseModel):
    id: str
    filename: str
    status: JobStatus
    progress: float = 0.0
    error: str | None = None
    audio_url: str | None = None


class DirectedChunk(BaseModel):
    index: int
    original_text: str
    directed_text: str
