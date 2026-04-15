import { useDashboard, useProjects } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/store';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/types';
import type { TaskStatus, TaskPriority } from '@/types';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderOpen,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusColors: Record<TaskStatus, string> = {
  backlog: 'bg-surface-3',
  todo: 'bg-ink-4',
  in_progress: 'bg-brand-500',
  in_review: 'bg-amber-400',
  done: 'bg-emerald-500',
};

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-surface-3',
  medium: 'bg-sky-400',
  high: 'bg-amber-400',
  urgent: 'bg-accent-rose',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading } = useDashboard();
  const { data: projectsData } = useProjects();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink-0">
          {greeting()}, {user?.full_name?.split(' ')[0]}
        </h1>
        <p className="text-ink-3 font-body mt-1">Here&apos;s what&apos;s happening across your projects</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon={<FolderOpen className="w-5 h-5" />}
          label="Active Projects"
          value={stats?.active_projects ?? 0}
          accent="bg-brand-50 text-brand-600"
        />
        <StatCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Total Tasks"
          value={stats?.total_tasks ?? 0}
          accent="bg-violet-50 text-accent-violet"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Completed This Week"
          value={stats?.tasks_completed_this_week ?? 0}
          accent="bg-emerald-50 text-accent-emerald"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Overdue"
          value={stats?.overdue_tasks ?? 0}
          accent="bg-rose-50 text-accent-rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion rate */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-brand-600" />
            <h3 className="font-display font-semibold text-ink-0">Completion Rate</h3>
          </div>
          <div className="flex items-end gap-3 mb-4">
            <span className="font-display text-4xl font-bold text-ink-0">
              {stats?.completion_rate ?? 0}%
            </span>
          </div>
          <div className="w-full bg-surface-2 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-700"
              style={{ width: `${stats?.completion_rate ?? 0}%` }}
            />
          </div>
        </div>

        {/* Tasks by status */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-ink-0 mb-5">Tasks by Status</h3>
          <div className="space-y-3">
            {stats &&
              (Object.entries(stats.tasks_by_status) as [TaskStatus, number][]).map(
                ([status, count]) => (
                  <div key={status} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${statusColors[status]}`} />
                    <span className="text-sm text-ink-2 font-body flex-1">
                      {TASK_STATUS_LABELS[status]}
                    </span>
                    <span className="text-sm font-display font-semibold text-ink-0">{count}</span>
                  </div>
                )
              )}
          </div>
        </div>

        {/* Tasks by priority */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-ink-0 mb-5">Tasks by Priority</h3>
          <div className="space-y-3">
            {stats &&
              (Object.entries(stats.tasks_by_priority) as [TaskPriority, number][]).map(
                ([priority, count]) => {
                  const total = stats.total_tasks || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={priority}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-ink-2 font-body">
                          {TASK_PRIORITY_LABELS[priority]}
                        </span>
                        <span className="text-sm font-display font-semibold text-ink-0">
                          {count}
                        </span>
                      </div>
                      <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${priorityColors[priority]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      {stats && stats.recent_activity.length > 0 && (
        <div className="card p-6 mt-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-5 h-5 text-brand-600" />
            <h3 className="font-display font-semibold text-ink-0">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {stats.recent_activity.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 py-2.5 border-b border-surface-2 last:border-0"
              >
                <div className={`w-2 h-2 rounded-full ${statusColors[item.status]}`} />
                <span className="font-body text-sm text-ink-0 flex-1 truncate">{item.title}</span>
                <span className={`badge badge-${item.priority}`}>
                  {TASK_PRIORITY_LABELS[item.priority]}
                </span>
                <span className="text-xs text-ink-4 font-body whitespace-nowrap">
                  {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          {icon}
        </div>
      </div>
      <p className="font-display text-3xl font-bold text-ink-0 mb-1">{value}</p>
      <p className="text-sm text-ink-3 font-body">{label}</p>
    </div>
  );
}
