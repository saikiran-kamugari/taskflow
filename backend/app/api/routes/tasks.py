import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.project import Project
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.user import User
from app.schemas.task import (
    TaskCreate,
    TaskListResponse,
    TaskReorder,
    TaskResponse,
    TaskUpdate,
    TaskBulkUpdate,
)

router = APIRouter(prefix="/tasks", tags=["Tasks"])


async def _verify_project_access(
    project_id: uuid.UUID, user: User, db: AsyncSession
) -> Project:
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    project_id: uuid.UUID,
    status_filter: TaskStatus | None = Query(None, alias="status"),
    priority_filter: TaskPriority | None = Query(None, alias="priority"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _verify_project_access(project_id, current_user, db)

    query = select(Task).where(Task.project_id == project_id)
    count_query = select(func.count(Task.id)).where(Task.project_id == project_id)

    if status_filter:
        query = query.where(Task.status == status_filter)
        count_query = count_query.where(Task.status == status_filter)
    if priority_filter:
        query = query.where(Task.priority == priority_filter)
        count_query = count_query.where(Task.priority == priority_filter)

    total = (await db.execute(count_query)).scalar() or 0

    result = await db.execute(
        query.options(selectinload(Task.assignee))
        .order_by(Task.position, Task.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    tasks = result.scalars().all()
    return TaskListResponse(tasks=[TaskResponse.model_validate(t) for t in tasks], total=total)


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _verify_project_access(data.project_id, current_user, db)

    # Get the next position for this status column
    max_pos = await db.execute(
        select(func.max(Task.position)).where(
            Task.project_id == data.project_id, Task.status == data.status
        )
    )
    next_position = (max_pos.scalar() or 0) + 1

    task = Task(**data.model_dump(), position=next_position)
    db.add(task)
    await db.flush()

    # Reload with relationships
    result = await db.execute(
        select(Task).options(selectinload(Task.assignee)).where(Task.id == task.id)
    )
    task = result.scalar_one()
    return TaskResponse.model_validate(task)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task).options(selectinload(Task.assignee)).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await _verify_project_access(task.project_id, current_user, db)
    return TaskResponse.model_validate(task)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task).options(selectinload(Task.assignee)).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await _verify_project_access(task.project_id, current_user, db)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await db.flush()

    result = await db.execute(
        select(Task).options(selectinload(Task.assignee)).where(Task.id == task.id)
    )
    task = result.scalar_one()
    return TaskResponse.model_validate(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await _verify_project_access(task.project_id, current_user, db)
    await db.delete(task)


@router.post("/reorder", response_model=TaskResponse)
async def reorder_task(
    data: TaskReorder,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).where(Task.id == data.task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await _verify_project_access(task.project_id, current_user, db)

    task.status = data.new_status
    task.position = data.new_position
    await db.flush()

    result = await db.execute(
        select(Task).options(selectinload(Task.assignee)).where(Task.id == task.id)
    )
    task = result.scalar_one()
    return TaskResponse.model_validate(task)


@router.post("/bulk-update", response_model=list[TaskResponse])
async def bulk_update_tasks(
    data: TaskBulkUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task).options(selectinload(Task.assignee)).where(Task.id.in_(data.task_ids))
    )
    tasks = result.scalars().all()

    updated = []
    for task in tasks:
        await _verify_project_access(task.project_id, current_user, db)
        if data.status:
            task.status = data.status
        if data.priority:
            task.priority = data.priority
        if data.assignee_id:
            task.assignee_id = data.assignee_id
        updated.append(TaskResponse.model_validate(task))

    await db.flush()
    return updated
