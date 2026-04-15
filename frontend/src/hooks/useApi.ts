import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Project, Task, DashboardStats, TaskStatus, TaskPriority } from '@/types';
import toast from 'react-hot-toast';

// ─── Dashboard ───────────────────────────────────────
export function useDashboard() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard/stats')).data,
  });
}

// ─── Projects ────────────────────────────────────────
export function useProjects() {
  return useQuery<{ projects: Project[]; total: number }>({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data,
  });
}

export function useProject(id: string) {
  return useQuery<Project>({
    queryKey: ['projects', id],
    queryFn: async () => (await api.get(`/projects/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; color?: string }) =>
      api.post('/projects', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Project created');
    },
    onError: () => toast.error('Failed to create project'),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string; color?: string; status?: string }) =>
      api.patch(`/projects/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated');
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Project deleted');
    },
  });
}

// ─── Tasks ───────────────────────────────────────────
export function useTasks(projectId: string, status?: TaskStatus, priority?: TaskPriority) {
  const params = new URLSearchParams({ project_id: projectId });
  if (status) params.set('status', status);
  if (priority) params.set('priority', priority);

  return useQuery<{ tasks: Task[]; total: number }>({
    queryKey: ['tasks', projectId, status, priority],
    queryFn: async () => (await api.get(`/tasks?${params}`)).data,
    enabled: !!projectId,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      due_date?: string;
      project_id: string;
    }) => api.post('/tasks', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task created');
    },
    onError: () => toast.error('Failed to create task'),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; status?: TaskStatus; priority?: TaskPriority; description?: string; due_date?: string | null }) =>
      api.patch(`/tasks/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task deleted');
    },
  });
}
