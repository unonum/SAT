import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@/lib/store';
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
import ErrorLog from '@/pages/ErrorLog';
import ProgressReport from '@/pages/ProgressReport';
import ParentDashboard from '@/pages/ParentDashboard';
import Admin from '@/pages/Admin';
import Settings from '@/pages/Settings';

function Protected({ children }: { children: ReactNode }) {
  const user = useStore((s) => s.user);
  const hasDiagnostic = useStore((s) => s.hasDiagnostic);
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace />;
  if (!hasDiagnostic && location.pathname !== '/assessment') {
    return <Navigate to="/assessment" replace />;
  }
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Auth signup />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/assessment" element={<AssessmentGate />} />

      <Route path="/app" element={<Protected><Dashboard /></Protected>} />
      <Route path="/app/practice" element={<Protected><DailyPractice /></Protected>} />
      <Route path="/app/weakness" element={<Protected><Weakness /></Protected>} />
      <Route path="/app/plan" element={<Protected><StudyPlan /></Protected>} />
      <Route path="/app/mock" element={<Protected><MockTest /></Protected>} />
      <Route path="/app/errors" element={<Protected><ErrorLog /></Protected>} />
      <Route path="/app/report" element={<Protected><ProgressReport /></Protected>} />
      <Route path="/app/parent" element={<Protected><ParentDashboard /></Protected>} />
      <Route path="/app/admin" element={<Protected><Admin /></Protected>} />
      <Route path="/app/settings" element={<Protected><Settings /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AssessmentGate() {
  const user = useStore((s) => s.user);
  if (!user) return <Navigate to="/signup" replace />;
  return <Assessment />;
}
