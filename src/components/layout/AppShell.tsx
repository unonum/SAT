import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { levelFromXp } from '@/lib/gamification';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  LayoutDashboard, Dumbbell, Target, CalendarCheck, FileText,
  AlertTriangle, LineChart, Database, Settings, Sun, Moon,
  Flame, Menu, X, LogOut, Sparkles, ChevronRight, Crown,
  ClipboardCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isAdmin } from '@/lib/auth';
import SyncIndicator from '@/components/SyncIndicator';

const STUDENT_NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/practice', label: 'Daily Practice', icon: Dumbbell },
  { to: '/app/weakness', label: 'Weakness Lab', icon: Target },
  { to: '/app/plan', label: 'Study Plan', icon: CalendarCheck },
  { to: '/app/mock', label: 'Mock Test', icon: FileText },
  { to: '/app/errors', label: 'Error Log', icon: AlertTriangle },
  { to: '/app/report', label: 'Progress Report', icon: LineChart },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

const ADMIN_NAV = [
  { to: '/app/team', label: 'Master Dashboard', icon: Crown, end: true },
  { to: '/app/admin', label: 'Question Bank', icon: Database },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, theme, setTheme, gamification, logout } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const lvl = levelFromXp(gamification.xp);
  const pct = Math.round((lvl.into / lvl.needed) * 100);
  const admin = isAdmin(user?.email);
  const NAV = admin ? ADMIN_NAV : STUDENT_NAV;
  const homeLink = admin ? '/app/team' : '/app';

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <NavLink to={homeLink} className="flex items-center gap-3 px-5 py-5" onClick={() => setOpen(false)}>
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-white shadow-glow">
          <Target size={20} />
        </div>
        <span className="font-display text-lg font-extrabold">
          Target<span className="gradient-text">1450</span>
        </span>
      </NavLink>

      {/* Attention CTA — start a full evaluation (students only) */}
      {!admin && (
        <div className="px-3 pb-2">
          <NavLink
            to="/app/evaluation"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold overflow-hidden transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-brand-600 text-white shadow-glow-violet'
                  : 'text-white bg-gradient-to-r from-violet-500 to-brand-500 shadow-glow-violet hover:brightness-110'
              )
            }
          >
            {/* shimmer */}
            <motion.span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              initial={{ x: '-120%' }}
              animate={{ x: '120%' }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut', repeatDelay: 1.2 }}
            />
            <span className="relative grid h-7 w-7 place-items-center rounded-lg bg-white/20">
              <ClipboardCheck size={16} />
            </span>
            <span className="relative flex-1">Start Evaluation</span>
            <span className="relative rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-bold">3 tests</span>
          </NavLink>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto pb-2">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative',
                isActive
                  ? 'bg-gradient-brand text-white shadow-glow'
                  : 'text-muted hover:text-[rgb(var(--text))] hover:bg-brand-500/8 dark:hover:bg-brand-500/10'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={17} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* XP bar (students only) */}
      {admin ? (
        <div className="mx-3 mb-3 rounded-2xl border border-violet-500/20 bg-violet-500/5 dark:bg-violet-500/10 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400">
            <Crown size={13} /> Admin account
          </div>
          <p className="text-xs text-muted mt-1">Monitoring student progress</p>
        </div>
      ) : (
        <div className="mx-3 mb-3 rounded-2xl border border-brand-500/20 bg-brand-500/5 dark:bg-brand-500/10 p-3.5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="flex items-center gap-1.5 font-bold text-brand-600 dark:text-brand-300">
              <Sparkles size={13} /> Level {lvl.level}
            </span>
            <span className="text-muted">{gamification.xp} XP</span>
          </div>
          <div className="h-1.5 rounded-full bg-brand-500/15 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted">
            <Flame size={12} className="text-orange-400" />
            <span>{gamification.streak}-day streak</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[rgb(var(--border))] bg-white/80 dark:bg-[#0b0f1e]/90 backdrop-blur-xl lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.aside
              className="absolute inset-y-0 left-0 w-64 border-r border-[rgb(var(--border))] bg-white/95 dark:bg-[#0b0f1e]/98 backdrop-blur-xl"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            >
              <SidebarContent />
            </motion.aside>
            <button className="absolute right-4 top-4 z-50 grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[rgb(var(--border))] bg-white/70 dark:bg-[#0b0f1e]/80 px-4 py-3 backdrop-blur-xl">
          <button className="lg:hidden btn-ghost h-9 w-9 p-0" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu size={18} />
          </button>

          <div className="flex-1">
            <div className="text-sm font-semibold">
              Hi, {user?.name?.split(' ')[0] ?? 'Student'} 👋
            </div>
            <div className="text-xs text-muted">
              {admin ? 'Admin · monitoring your students.' : (
                <>Target <span className="font-semibold text-brand-600 dark:text-brand-300">{user?.targetScore ?? 1450}</span> · let's close the gap.</>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SyncIndicator />
            {!admin && (
              <span className="chip bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <Flame size={13} /> {gamification.streak}d
              </span>
            )}
            <button className="btn-ghost h-9 w-9 p-0" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              className="btn-ghost h-9 w-9 p-0"
              onClick={() => { logout(); navigate('/'); }}
              aria-label="Log out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
