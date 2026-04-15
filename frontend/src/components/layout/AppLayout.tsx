import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { useProjects } from '@/hooks/useApi';
import {
  LayoutDashboard,
  FolderKanban,
  LogOut,
  Plus,
  Zap,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display font-medium transition-all duration-150 ${
    isActive
      ? 'bg-brand-50 text-brand-700 shadow-sm'
      : 'text-ink-2 hover:bg-surface-2 hover:text-ink-0'
  }`;

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { data: projectsData } = useProjects();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-surface-1">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-[72px]' : 'w-64'
        } bg-white border-r border-surface-3 flex flex-col transition-all duration-200 shrink-0`}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-surface-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <span className="font-display font-bold text-lg text-ink-0 whitespace-nowrap">
                TaskFlow
              </span>
            )}
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="btn-ghost !p-1.5">
            <ChevronRight
              className={`w-4 h-4 text-ink-3 transition-transform ${collapsed ? '' : 'rotate-180'}`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <NavLink to="/" end className={navLinkClass}>
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            {!collapsed && 'Dashboard'}
          </NavLink>
          <NavLink to="/projects" end className={navLinkClass}>
            <FolderKanban className="w-5 h-5 shrink-0" />
            {!collapsed && 'Projects'}
          </NavLink>

          {!collapsed && projectsData && projectsData.projects.length > 0 && (
            <div className="pt-4 mt-4 border-t border-surface-3">
              <p className="px-3 text-xs font-display font-semibold text-ink-4 uppercase tracking-wider mb-2">
                Projects
              </p>
              {projectsData.projects.slice(0, 8).map((p) => (
                <NavLink key={p.id} to={`/projects/${p.id}`} className={navLinkClass}>
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="truncate">{p.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-surface-3 space-y-1">
          {!collapsed && user && (
            <div className="px-3 py-2 mb-1">
              <p className="text-sm font-display font-semibold text-ink-0 truncate">
                {user.full_name}
              </p>
              <p className="text-xs text-ink-3 truncate">{user.email}</p>
            </div>
          )}
          <button onClick={handleLogout} className="btn-ghost w-full justify-start text-accent-rose">
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
