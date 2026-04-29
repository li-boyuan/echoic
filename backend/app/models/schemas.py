from enum import Enum

from pydantic import BaseModel


class JobStatus(str, Enum):
    PENDING = "pending"
    DIRECTING = "directing"
    NARRATING = "narrating"
    COMPLETED = "completed"
    FAILED = "failed"


class ChapterInfo(BaseModel):
    index: int
    title: str
    status: str = "pending"
    audio_url: str | None = None


class JobResponse(BaseModel):
    id: str
    filename: str
    status: JobStatus
    progress: float = 0.0
    voice: str = "Kore"
    cast: dict[str, str] = {}
    chapters: list[ChapterInfo] = []
    error: str | None = None
    audio_url: str | None = None


class VoiceOption(BaseModel):
    id: str
    name: str
    description: str
