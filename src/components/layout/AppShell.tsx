import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { levelFromXp } from '@/lib/gamification';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  LayoutDashboard,
  Dumbbell,
  Target,
  CalendarCheck,
  FileText,
  AlertTriangle,
  LineChart,
  Users,
  Database,
  Settings,
  Sun,
  Moon,
  Flame,
  Menu,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/practice', label: 'Daily Practice', icon: Dumbbell },
  { to: '/app/weakness', label: 'Weakness Lab', icon: Target },
  { to: '/app/plan', label: 'Study Plan', icon: CalendarCheck },
  { to: '/app/mock', label: 'Mock Test', icon: FileText },
  { to: '/app/errors', label: 'Error Log', icon: AlertTriangle },
  { to: '/app/report', label: 'Progress Report', icon: LineChart },
  { to: '/app/parent', label: 'Parent / Tutor', icon: Users },
  { to: '/app/admin', label: 'Question Bank', icon: Database },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, theme, setTheme, gamification, logout } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const lvl = levelFromXp(gamification.xp);

  const sidebar = (
    <div className="flex h-full flex-col">
      <NavLink to="/app" className="flex items-center gap-2.5 px-5 py-5" onClick={() => setOpen(false)}>
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
          <Target size={20} />
        </div>
        <span className="font-display text-lg font-extrabold">Target1450</span>
      </NavLink>

      <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-600 text-white shadow-glow'
                  : 'text-muted hover:bg-slate-100 dark:hover:bg-slate-800'
              )
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="m-3 rounded-xl border surface p-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-brand-600 dark:text-brand-300">
            <Sparkles size={14} /> Level {lvl.level}
          </span>
          <span className="text-muted">{gamification.xp} XP</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-accent-500"
            style={{ width: `${(lvl.into / lvl.needed) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r surface lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r surface animate-fade-up">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b surface px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-opacity-80">
          <button className="lg:hidden btn-ghost h-9 w-9 p-0" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu size={18} />
          </button>
          <div className="flex-1">
            <div className="text-sm font-semibold">Hi, {user?.name?.split(' ')[0] ?? 'Student'} 👋</div>
            <div className="text-xs text-muted">Target {user?.targetScore ?? 1450} · let's close the gap.</div>
          </div>

          <div className="flex items-center gap-2">
            <span className="chip bg-orange-500/10 text-orange-500">
              <Flame size={14} /> {gamification.streak} day
            </span>
            <button
              className="btn-ghost h-9 w-9 p-0"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="btn-ghost h-9 w-9 p-0"
              onClick={() => {
                logout();
                navigate('/');
              }}
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
      </div>

      {open && (
        <button className="fixed right-4 top-3 z-50 lg:hidden text-white" onClick={() => setOpen(false)}>
          <X />
        </button>
      )}
    </div>
  );
}
