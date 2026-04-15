import uuid
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.task import TaskStatus, TaskPriority
from app.schemas.user import UserResponse


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    description: str | None = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: datetime | None = None
    project_id: uuid.UUID
    assignee_id: uuid.UUID | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    position: int | None = None
    due_date: datetime | None = None
    assignee_id: uuid.UUID | None = None


class TaskResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    position: int
    due_date: datetime | None
    project_id: uuid.UUID
    assignee_id: uuid.UUID | None
    assignee: UserResponse | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
    total: int


class TaskBulkUpdate(BaseModel):
    task_ids: list[uuid.UUID]
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    assignee_id: uuid.UUID | None = None


class TaskReorder(BaseModel):
    task_id: uuid.UUID
    new_status: TaskStatus
    new_position: int
