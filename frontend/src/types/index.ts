// ─── User ────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// ─── Project ─────────────────────────────────────────
export type ProjectStatus = 'active' | 'archived' | 'completed';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  status: ProjectStatus;
  owner_id: string;
  created_at: string;
  updated_at: string;
  task_count: number;
  completed_task_count: number;
}

// ─── Task ────────────────────────────────────────────
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  due_date: string | null;
  project_id: string;
  assignee_id: string | null;
  assignee: User | null;
  created_at: string;
  updated_at: string;
}

// ─── Dashboard ───────────────────────────────────────
export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  total_tasks: number;
  tasks_by_status: Record<TaskStatus, number>;
  tasks_by_priority: Record<TaskPriority, number>;
  overdue_tasks: number;
  tasks_completed_this_week: number;
  completion_rate: number;
  recent_activity: {
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    updated_at: string;
  }[];
}

// ─── API ─────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
  'backlog', 'todo', 'in_progress', 'in_review', 'done',
];
