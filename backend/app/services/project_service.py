import uuid
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.project import Project
from app.models.task import Task, TaskStatus
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse


class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: ProjectCreate, owner_id: uuid.UUID) -> ProjectResponse:
        project = Project(**data.model_dump(), owner_id=owner_id)
        self.db.add(project)
        await self.db.flush()
        await self.db.refresh(project)
        return await self._to_response(project)

    async def get_all(self, owner_id: uuid.UUID) -> list[ProjectResponse]:
        result = await self.db.execute(
            select(Project)
            .where(Project.owner_id == owner_id)
            .order_by(Project.created_at.desc())
        )
        projects = result.scalars().all()
        return [await self._to_response(p) for p in projects]

    async def get_by_id(self, project_id: uuid.UUID, owner_id: uuid.UUID) -> ProjectResponse:
        project = await self._get_project(project_id, owner_id)
        return await self._to_response(project)

    async def update(self, project_id: uuid.UUID, data: ProjectUpdate, owner_id: uuid.UUID) -> ProjectResponse:
        project = await self._get_project(project_id, owner_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(project, key, value)
        await self.db.flush()
        await self.db.refresh(project)
        return await self._to_response(project)

    async def delete(self, project_id: uuid.UUID, owner_id: uuid.UUID) -> None:
        project = await self._get_project(project_id, owner_id)
        await self.db.delete(project)

    async def _get_project(self, project_id: uuid.UUID, owner_id: uuid.UUID) -> Project:
        result = await self.db.execute(
            select(Project).where(Project.id == project_id, Project.owner_id == owner_id)
        )
        project = result.scalar_one_or_none()
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return project

    async def _to_response(self, project: Project) -> ProjectResponse:
        # Count tasks
        total_result = await self.db.execute(
            select(func.count(Task.id)).where(Task.project_id == project.id)
        )
        task_count = total_result.scalar() or 0

        done_result = await self.db.execute(
            select(func.count(Task.id)).where(
                Task.project_id == project.id, Task.status == TaskStatus.DONE
            )
        )
        completed_count = done_result.scalar() or 0

        return ProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            color=project.color,
            icon=project.icon,
            status=project.status,
            owner_id=project.owner_id,
            created_at=project.created_at,
            updated_at=project.updated_at,
            task_count=task_count,
            completed_task_count=completed_count,
        )
