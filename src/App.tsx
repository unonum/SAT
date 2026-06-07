import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { isAdmin } from '@/lib/auth';
import { evaluationsComplete } from '@/lib/evaluation';
import AppShell from '@/components/layout/AppShell';
import type { ReactNode } from 'react';

import Landing from '@/pages/Landing';
import Auth from '@/pages/Auth';
import Pricing from '@/pages/Pricing';
import Assessment from '@/pages/Assessment';
import Dashboard from '@/pages/Dashboard';
import DailyPractice from '@/pages/DailyPractice';
import Weakness from '@/pages/Weakness';
import StudyPlan from '@/pages/StudyPlan';
import MockTest from '@/pages/MockTest';
import Evaluation from '@/pages/Evaluation';
import ErrorLog from '@/pages/ErrorLog';
import ProgressReport from '@/pages/ProgressReport';
import ParentDashboard from '@/pages/ParentDashboard';
import TeamDashboard from '@/pages/TeamDashboard';
import Admin from '@/pages/Admin';
import Settings from '@/pages/Settings';

// Panels a student may reach before the benchmark evaluations are complete.
const UNLOCKED_BEFORE_BENCHMARK = ['/app/evaluation', '/app/settings'];

function Protected({ children }: { children: ReactNode }) {
  const user = useStore((s) => s.user);
  const attempts = useStore((s) => s.attempts);
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace />;
  // Students must finish the 3 benchmark evaluations before the rest unlocks.
  if (
    !isAdmin(user.email) &&
    !evaluationsComplete(attempts) &&
    !UNLOCKED_BEFORE_BENCHMARK.includes(location.pathname)
  ) {
    return <Navigate to="/app/evaluation" replace />;
  }
  return <AppShell>{children}</AppShell>;
}

/** Admin-only route guard. */
function AdminOnly({ children }: { children: ReactNode }) {
  const user = useStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin(user.email)) return <Navigate to="/app" replace />;
  return <AppShell>{children}</AppShell>;
}

/** Students see their own dashboard; admins are sent to the master dashboard. */
function HomeRedirect() {
  const user = useStore((s) => s.user);
  if (user && isAdmin(user.email)) return <Navigate to="/app/team" replace />;
  return <Protected><Dashboard /></Protected>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Auth signup />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/assessment" element={<AssessmentGate />} />

      <Route path="/app" element={<HomeRedirect />} />
      <Route path="/app/team" element={<AdminOnly><TeamDashboard /></AdminOnly>} />
      <Route path="/app/practice" element={<Protected><DailyPractice /></Protected>} />
      <Route path="/app/weakness" element={<Protected><Weakness /></Protected>} />
      <Route path="/app/plan" element={<Protected><StudyPlan /></Protected>} />
      <Route path="/app/mock" element={<Protected><MockTest /></Protected>} />
      <Route path="/app/evaluation" element={<Protected><Evaluation /></Protected>} />
      <Route path="/app/errors" element={<Protected><ErrorLog /></Protected>} />
      <Route path="/app/report" element={<Protected><ProgressReport /></Protected>} />
      <Route path="/app/parent" element={<Protected><ParentDashboard /></Protected>} />
      <Route path="/app/admin" element={<AdminOnly><Admin /></AdminOnly>} />
      <Route path="/app/settings" element={<Protected><Settings /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AssessmentGate() {
  const user = useStore((s) => s.user);
  if (!user) return <Navigate to="/signup" replace />;
  if (isAdmin(user.email)) return <Navigate to="/app/team" replace />;
  return <Assessment />;
}
