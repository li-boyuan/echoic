from enum import Enum

from pydantic import BaseModel


class JobStatus(str, Enum):
    PENDING = "pending"
    DIRECTING = "directing"
    NARRATING = "narrating"
    COMPLETED = "completed"
    FAILED = "failed"


class JobResponse(BaseModel):
    id: str
    filename: str
    status: JobStatus
    progress: float = 0.0
    voice: str = "Kore"
    character_voice: str = "Aoede"
    error: str | None = None
    audio_url: str | None = None


class VoiceOption(BaseModel):
    id: str
    name: str
    description: str
