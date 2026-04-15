import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects, useCreateProject, useDeleteProject } from '@/hooks/useApi';
import { Plus, MoreHorizontal, Trash2, FolderOpen, CheckCircle2 } from 'lucide-react';

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b',
  '#10b981', '#0ea5e9', '#06b6d4', '#84cc16', '#f97316',
];

export default function ProjectsPage() {
  const { data, isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState(PROJECT_COLORS[0]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createProject.mutateAsync({ name: newName, description: newDesc || undefined, color: newColor });
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-0">Projects</h1>
          <p className="text-ink-3 font-body mt-1">{data?.total ?? 0} projects total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg p-6 animate-slide-up">
            <h2 className="font-display text-xl font-bold text-ink-0 mb-5">Create Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-display font-medium text-ink-1 mb-1.5">Name</label>
                <input
                  className="input-field"
                  placeholder="My Awesome Project"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-display font-medium text-ink-1 mb-1.5">Description</label>
                <textarea
                  className="input-field min-h-[80px] resize-none"
                  placeholder="What's this project about?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-display font-medium text-ink-1 mb-2">Color</label>
                <div className="flex gap-2">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        newColor === c ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={createProject.isPending} className="btn-primary flex-1">
                  {createProject.isPending ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project grid */}
      {data && data.projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen className="w-12 h-12 text-ink-4 mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold text-ink-1 mb-2">No projects yet</h3>
          <p className="text-ink-3 font-body mb-6">Create your first project to get started</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto">
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data?.projects.map((project) => {
            const progress =
              project.task_count > 0
                ? Math.round((project.completed_task_count / project.task_count) * 100)
                : 0;

            return (
              <div key={project.id} className="card group relative">
                <Link to={`/projects/${project.id}`} className="block p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: project.color + '18' }}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-semibold text-ink-0 truncate group-hover:text-brand-600 transition-colors">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-ink-3 font-body mt-0.5 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-ink-3 font-body">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {project.completed_task_count}/{project.task_count} tasks
                    </span>
                    <div className="flex-1" />
                    <span className="font-display font-semibold text-ink-1">{progress}%</span>
                  </div>
                  <div className="w-full bg-surface-2 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: project.color,
                      }}
                    />
                  </div>
                </Link>

                {/* Context menu */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpen(menuOpen === project.id ? null : project.id);
                    }}
                    className="btn-ghost !p-1.5 opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {menuOpen === project.id && (
                    <div className="absolute right-0 mt-1 bg-white border border-surface-3 rounded-xl shadow-modal py-1 w-40 z-10">
                      <button
                        onClick={() => {
                          deleteProject.mutate(project.id);
                          setMenuOpen(null);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-accent-rose hover:bg-rose-50 font-display"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Project
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
