import uuid
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.task import Task, TaskStatus
from app.models.project import Project
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskReorder


class TaskService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: TaskCreate, owner_id: uuid.UUID) -> TaskResponse:
        # Verify project ownership
        await self._verify_project_access(data.project_id, owner_id)

        # Get next position
        result = await self.db.execute(
            select(func.coalesce(func.max(Task.position), -1))
            .where(Task.project_id == data.project_id, Task.status == data.status)
        )
        next_position = (result.scalar() or 0) + 1

        task = Task(**data.model_dump(), position=next_position)
        self.db.add(task)
        await self.db.flush()
        await self.db.refresh(task, ["assignee"])
        return TaskResponse.model_validate(task)

    async def get_by_project(
        self, project_id: uuid.UUID, owner_id: uuid.UUID,
        status_filter: TaskStatus | None = None
    ) -> list[TaskResponse]:
        await self._verify_project_access(project_id, owner_id)

        query = (
            select(Task)
            .options(selectinload(Task.assignee))
            .where(Task.project_id == project_id)
            .order_by(Task.position)
        )
        if status_filter:
            query = query.where(Task.status == status_filter)

        result = await self.db.execute(query)
        tasks = result.scalars().all()
        return [TaskResponse.model_validate(t) for t in tasks]

    async def get_by_id(self, task_id: uuid.UUID, owner_id: uuid.UUID) -> TaskResponse:
        task = await self._get_task(task_id, owner_id)
        return TaskResponse.model_validate(task)

    async def update(self, task_id: uuid.UUID, data: TaskUpdate, owner_id: uuid.UUID) -> TaskResponse:
        task = await self._get_task(task_id, owner_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(task, key, value)
        await self.db.flush()
        await self.db.refresh(task, ["assignee"])
        return TaskResponse.model_validate(task)

    async def delete(self, task_id: uuid.UUID, owner_id: uuid.UUID) -> None:
        task = await self._get_task(task_id, owner_id)
        await self.db.delete(task)

    async def reorder(self, data: TaskReorder, owner_id: uuid.UUID) -> TaskResponse:
        task = await self._get_task(data.task_id, owner_id)

        # Shift positions in target column
        await self.db.execute(
            select(Task).where(
                and_(
                    Task.project_id == task.project_id,
                    Task.status == data.new_status,
                    Task.position >= data.new_position,
                    Task.id != task.id,
                )
            )
        )

        task.status = data.new_status
        task.position = data.new_position
        await self.db.flush()
        await self.db.refresh(task, ["assignee"])
        return TaskResponse.model_validate(task)

    async def get_dashboard_stats(self, owner_id: uuid.UUID) -> dict:
        # Total tasks across all owned projects
        result = await self.db.execute(
            select(Task.status, func.count(Task.id))
            .join(Project, Task.project_id == Project.id)
            .where(Project.owner_id == owner_id)
            .group_by(Task.status)
        )
        status_counts = dict(result.all())

        # Tasks by priority
        result = await self.db.execute(
            select(Task.priority, func.count(Task.id))
            .join(Project, Task.project_id == Project.id)
            .where(Project.owner_id == owner_id)
            .group_by(Task.priority)
        )
        priority_counts = dict(result.all())

        # Recent tasks
        result = await self.db.execute(
            select(Task)
            .options(selectinload(Task.assignee))
            .join(Project, Task.project_id == Project.id)
            .where(Project.owner_id == owner_id)
            .order_by(Task.updated_at.desc())
            .limit(5)
        )
        recent_tasks = [TaskResponse.model_validate(t) for t in result.scalars().all()]

        total = sum(status_counts.values())
        done = status_counts.get(TaskStatus.DONE, 0)

        return {
            "total_tasks": total,
            "completed_tasks": done,
            "completion_rate": round((done / total * 100) if total > 0 else 0, 1),
            "status_breakdown": {s.value: status_counts.get(s, 0) for s in TaskStatus},
            "priority_breakdown": {p.value: priority_counts.get(p, 0) for p in ["low", "medium", "high", "urgent"]},
            "recent_tasks": recent_tasks,
        }

    async def _get_task(self, task_id: uuid.UUID, owner_id: uuid.UUID) -> Task:
        result = await self.db.execute(
            select(Task)
            .options(selectinload(Task.assignee))
            .join(Project, Task.project_id == Project.id)
            .where(Task.id == task_id, Project.owner_id == owner_id)
        )
        task = result.scalar_one_or_none()
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        return task

    async def _verify_project_access(self, project_id: uuid.UUID, owner_id: uuid.UUID):
        result = await self.db.execute(
            select(Project).where(Project.id == project_id, Project.owner_id == owner_id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
