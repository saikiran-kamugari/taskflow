import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useApi';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
  TASK_PRIORITY_LABELS,
} from '@/types';
import type { TaskStatus, TaskPriority, Task } from '@/types';
import {
  Plus,
  ArrowLeft,
  GripVertical,
  Calendar,
  Trash2,
  X,
  ChevronDown,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const columnAccents: Record<TaskStatus, string> = {
  backlog: 'border-t-surface-4',
  todo: 'border-t-ink-4',
  in_progress: 'border-t-brand-500',
  in_review: 'border-t-amber-400',
  done: 'border-t-emerald-500',
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading: projLoading } = useProject(id!);
  const { data: tasksData, isLoading: tasksLoading } = useTasks(id!);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [addingTo, setAddingTo] = useState<TaskStatus | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (projLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-ink-3">Project not found</p>
      </div>
    );
  }

  const tasksByStatus: Record<TaskStatus, Task[]> = {
    backlog: [],
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  };
  tasksData?.tasks.forEach((t) => tasksByStatus[t.status].push(t));

  const handleAddTask = async (status: TaskStatus) => {
    if (!newTitle.trim()) return;
    await createTask.mutateAsync({
      title: newTitle,
      project_id: id!,
      status,
      priority: newPriority,
    });
    setNewTitle('');
    setNewPriority('medium');
    setAddingTo(null);
  };

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    updateTask.mutate({ id: task.id, status: newStatus });
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="px-8 py-5 border-b border-surface-3 bg-white shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="btn-ghost !p-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: project.color + '18' }}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-ink-0">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-ink-3 font-body">{project.description}</p>
            )}
          </div>
          <div className="flex-1" />
          <span className="text-sm text-ink-3 font-body">
            {project.task_count} tasks &middot; {project.completed_task_count} completed
          </span>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-5 h-full min-w-max">
          {TASK_STATUS_ORDER.map((status) => (
            <div key={status} className="w-72 flex flex-col shrink-0">
              {/* Column header */}
              <div
                className={`bg-white rounded-t-xl border-t-[3px] px-4 py-3 flex items-center gap-2 ${columnAccents[status]}`}
              >
                <span className="font-display font-semibold text-sm text-ink-0">
                  {TASK_STATUS_LABELS[status]}
                </span>
                <span className="text-xs font-display font-medium text-ink-4 bg-surface-2 px-2 py-0.5 rounded-full">
                  {tasksByStatus[status].length}
                </span>
                <div className="flex-1" />
                <button
                  onClick={() => setAddingTo(status)}
                  className="btn-ghost !p-1 text-ink-3 hover:text-brand-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Cards */}
              <div className="flex-1 bg-surface-1 rounded-b-xl p-2 space-y-2 overflow-y-auto">
                {/* Add task form */}
                {addingTo === status && (
                  <div className="bg-white rounded-xl border border-brand-300 shadow-card p-3 animate-slide-up">
                    <input
                      className="w-full text-sm font-body text-ink-0 placeholder:text-ink-4 outline-none mb-2"
                      placeholder="Task title..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTask(status);
                        if (e.key === 'Escape') setAddingTo(null);
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                        className="text-xs bg-surface-1 border border-surface-3 rounded-lg px-2 py-1 font-display"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                      <div className="flex-1" />
                      <button onClick={() => setAddingTo(null)} className="btn-ghost !p-1 !text-xs">
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAddTask(status)}
                        className="btn-primary !py-1 !px-3 !text-xs"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {tasksByStatus[status].map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="bg-white rounded-xl border border-surface-3 p-3.5 cursor-pointer
                               hover:shadow-card-hover hover:border-surface-4 transition-all duration-150 group"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-surface-4 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-body font-medium text-ink-0 leading-snug">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <span className={`badge badge-${task.priority}`}>
                            {TASK_PRIORITY_LABELS[task.priority]}
                          </span>
                          {task.due_date && (
                            <span className="flex items-center gap-1 text-xs text-ink-3 font-body">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(task.due_date), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {tasksByStatus[status].length === 0 && addingTo !== status && (
                  <div className="text-center py-8">
                    <p className="text-xs text-ink-4 font-body">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task detail slide-over */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(data) => {
            updateTask.mutate({ id: selectedTask.id, ...data });
            setSelectedTask({ ...selectedTask, ...data });
          }}
          onDelete={() => {
            deleteTask.mutate(selectedTask.id);
            setSelectedTask(null);
          }}
          onStatusChange={(s) => handleStatusChange(selectedTask, s)}
        />
      )}
    </div>
  );
}

function TaskDetail({
  task,
  onClose,
  onUpdate,
  onDelete,
  onStatusChange,
}: {
  task: Task;
  onClose: () => void;
  onUpdate: (data: Partial<Task>) => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-modal animate-slide-in-right overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <select
                value={task.status}
                onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
                className="text-sm bg-surface-1 border border-surface-3 rounded-lg px-3 py-1.5 font-display font-medium"
              >
                {TASK_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {TASK_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onDelete} className="btn-ghost text-accent-rose !p-2">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="btn-ghost !p-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title */}
          <input
            className="w-full font-display text-xl font-bold text-ink-0 outline-none mb-4 placeholder:text-ink-4"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title !== task.title) onUpdate({ title });
            }}
          />

          {/* Priority */}
          <div className="mb-6">
            <label className="block text-sm font-display font-medium text-ink-2 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => onUpdate({ priority: p })}
                  className={`badge badge-${p} cursor-pointer transition-all ${
                    task.priority === p
                      ? 'ring-2 ring-offset-1 ring-brand-400'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {TASK_PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-display font-medium text-ink-2 mb-2">
              Description
            </label>
            <textarea
              className="input-field min-h-[120px] resize-none"
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description !== (task.description || ''))
                  onUpdate({ description: description || undefined });
              }}
            />
          </div>

          {/* Metadata */}
          <div className="mt-6 pt-6 border-t border-surface-3 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-3 font-body">Created</span>
              <span className="text-ink-1 font-body">
                {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-3 font-body">Updated</span>
              <span className="text-ink-1 font-body">
                {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
