import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Target, Mail, Lock, ArrowRight, Sparkles, Check, AlertCircle } from 'lucide-react';
import { checkCredentials } from '@/lib/auth';
import { flushPending } from '@/lib/db';

export default function Auth({ signup }: { signup?: boolean }) {
  const navigate = useNavigate();
  const { signup: doSignup, hydrateProfile, hydrateStudents } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = checkCredentials(email, password);
    if (!result.ok) {
      setError(result.error ?? 'Login failed.');
      return;
    }

    const normalized = email.trim().toLowerCase();
    setBusy(true);

    // create/swap to this account's profile
    doSignup({
      name: result.name ?? 'Student',
      email: normalized,
      role: result.isAdmin ? 'admin' : 'student',
      targetScore: 1550,
      studyHoursPerDay: 1,
    });

    // pull history from the DB (no-op in local-only mode)
    try {
      // first, sync anything that failed to upload on a previous session
      await flushPending();
      if (result.isAdmin) {
        await hydrateStudents();
        setBusy(false);
        navigate('/app/team');
        return;
      }
      await hydrateProfile(normalized);
    } catch {
      /* ignore network errors — fall back to local */
    }

    setBusy(false);
    // Students land in the app; the route guard sends them to the benchmark
    // evaluations first if those aren't complete yet.
    navigate('/app');
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 p-10 text-white lg:flex">
        {/* Orbs */}
        <div className="orb w-80 h-80 bg-white/10 -top-20 -left-20" />
        <div className="orb w-64 h-64 bg-accent-400/20 bottom-10 right-5" style={{ animationDelay: '2s' }} />
        {/* Grid dots */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '28px 28px' }} />

        <Link to="/" className="relative flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Target size={20} />
          </div>
          <span className="font-display text-lg font-extrabold">Target1550</span>
        </Link>

        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="font-display text-4xl font-extrabold leading-tight mb-4">
            Your personal AI SAT coach is ready.
          </h2>
          <p className="text-white/80 leading-relaxed max-w-sm">
            Sign up, take a quick diagnostic, and get a study plan built around exactly what you need to improve.
          </p>
          <ul className="mt-6 space-y-2.5">
            {['Score estimate in minutes', 'Adaptive plan from day one', 'AI tutor for every wrong answer', 'No credit card needed'].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-sm text-white/80">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20"><Check size={12} /></span>
                {t}
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="relative text-sm text-white/50">"Finds your weaknesses and fixes them automatically."</div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 sm:p-10 mesh-bg">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Mobile logo */}
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-white shadow-glow">
              <Target size={20} />
            </div>
            <span className="font-display text-lg font-extrabold">Target<span className="gradient-text">1550</span></span>
          </Link>

          <div className="mb-1 flex items-center gap-2">
            <Sparkles size={18} className="text-brand-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              Welcome back
            </span>
          </div>
          <h1 className="font-display text-3xl font-extrabold mb-1">Log in to continue</h1>
          <p className="text-sm text-muted mb-7">Access is limited to authorized accounts.</p>

          <form onSubmit={submit} className="space-y-3.5">
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3 text-muted" />
              <input
                className="input pl-10"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                autoComplete="username"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3 text-muted" />
              <input
                className="input pl-10"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
              >
                <AlertCircle size={15} className="shrink-0" /> {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              className="btn-primary w-full py-3 text-base"
              whileTap={{ scale: 0.97 }}
              disabled={busy}
            >
              {busy ? 'Loading your progress…' : <>Log in <ArrowRight size={17} /></>}
            </motion.button>
          </form>

          <p className="mt-5 text-center text-xs text-muted">
            Authorized accounts only. Need access? Contact the administrator.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
