from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.project import Project, ProjectStatus
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class DashboardStats(BaseModel):
    total_projects: int
    active_projects: int
    total_tasks: int
    tasks_by_status: dict[str, int]
    tasks_by_priority: dict[str, int]
    overdue_tasks: int
    tasks_completed_this_week: int
    completion_rate: float
    recent_activity: list[dict]


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Project counts
    proj_q = await db.execute(
        select(func.count(Project.id)).where(Project.owner_id == current_user.id)
    )
    total_projects = proj_q.scalar() or 0

    active_q = await db.execute(
        select(func.count(Project.id)).where(
            Project.owner_id == current_user.id, Project.status == ProjectStatus.ACTIVE
        )
    )
    active_projects = active_q.scalar() or 0

    # Get all user project IDs for task queries
    proj_ids_q = await db.execute(
        select(Project.id).where(Project.owner_id == current_user.id)
    )
    project_ids = [row[0] for row in proj_ids_q.all()]

    if not project_ids:
        return DashboardStats(
            total_projects=0, active_projects=0, total_tasks=0,
            tasks_by_status={s.value: 0 for s in TaskStatus},
            tasks_by_priority={p.value: 0 for p in TaskPriority},
            overdue_tasks=0, tasks_completed_this_week=0,
            completion_rate=0.0, recent_activity=[],
        )

    # Total tasks
    total_q = await db.execute(
        select(func.count(Task.id)).where(Task.project_id.in_(project_ids))
    )
    total_tasks = total_q.scalar() or 0

    # Tasks by status
    status_q = await db.execute(
        select(Task.status, func.count(Task.id))
        .where(Task.project_id.in_(project_ids))
        .group_by(Task.status)
    )
    tasks_by_status = {s.value: 0 for s in TaskStatus}
    for row in status_q.all():
        tasks_by_status[row[0].value] = row[1]

    # Tasks by priority
    prio_q = await db.execute(
        select(Task.priority, func.count(Task.id))
        .where(Task.project_id.in_(project_ids))
        .group_by(Task.priority)
    )
    tasks_by_priority = {p.value: 0 for p in TaskPriority}
    for row in prio_q.all():
        tasks_by_priority[row[0].value] = row[1]

    # Overdue tasks
    now = datetime.now(timezone.utc)
    overdue_q = await db.execute(
        select(func.count(Task.id)).where(
            Task.project_id.in_(project_ids),
            Task.due_date < now,
            Task.status != TaskStatus.DONE,
        )
    )
    overdue_tasks = overdue_q.scalar() or 0

    # Completed this week
    week_start = now - timedelta(days=now.weekday())
    week_q = await db.execute(
        select(func.count(Task.id)).where(
            Task.project_id.in_(project_ids),
            Task.status == TaskStatus.DONE,
            Task.updated_at >= week_start,
        )
    )
    tasks_completed_this_week = week_q.scalar() or 0

    completion_rate = (tasks_by_status.get("done", 0) / total_tasks * 100) if total_tasks > 0 else 0.0

    # Recent activity (last 10 updated tasks)
    recent_q = await db.execute(
        select(Task)
        .where(Task.project_id.in_(project_ids))
        .order_by(Task.updated_at.desc())
        .limit(10)
    )
    recent_tasks = recent_q.scalars().all()
    recent_activity = [
        {
            "id": str(t.id),
            "title": t.title,
            "status": t.status.value,
            "priority": t.priority.value,
            "updated_at": t.updated_at.isoformat(),
        }
        for t in recent_tasks
    ]

    return DashboardStats(
        total_projects=total_projects,
        active_projects=active_projects,
        total_tasks=total_tasks,
        tasks_by_status=tasks_by_status,
        tasks_by_priority=tasks_by_priority,
        overdue_tasks=overdue_tasks,
        tasks_completed_this_week=tasks_completed_this_week,
        completion_rate=round(completion_rate, 1),
        recent_activity=recent_activity,
    )
