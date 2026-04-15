import uuid
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.project import ProjectStatus


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    color: str = Field(default="#6366f1", pattern=r"^#[0-9a-fA-F]{6}$")
    icon: str = Field(default="folder", max_length=50)


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    icon: str | None = None
    status: ProjectStatus | None = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    color: str
    icon: str
    status: ProjectStatus
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    task_count: int = 0
    completed_task_count: int = 0

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    projects: list[ProjectResponse]
    total: int
