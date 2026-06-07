import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Target, Mail, Lock, User, ArrowRight, Chrome, Sparkles, Check } from 'lucide-react';

export default function Auth({ signup }: { signup?: boolean }) {
  const navigate = useNavigate();
  const { signup: doSignup, user, hasDiagnostic } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'student' | 'parent'>('student');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (signup || !user) {
      doSignup({ name: name || 'SAT Student', email: email || 'student@example.com', role, targetScore: 1450, studyHoursPerDay: 1 });
      navigate('/assessment');
    } else {
      navigate(hasDiagnostic ? '/app' : '/assessment');
    }
  };

  const quickGoogle = () => {
    doSignup({ name: 'Alex Chen', email: 'alex@gmail.com', role, targetScore: 1450, studyHoursPerDay: 1.5 });
    navigate('/assessment');
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
          <span className="font-display text-lg font-extrabold">Target1450</span>
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
            <span className="font-display text-lg font-extrabold">Target<span className="gradient-text">1450</span></span>
          </Link>

          <div className="mb-1 flex items-center gap-2">
            <Sparkles size={18} className="text-brand-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              {signup ? 'Get started' : 'Welcome back'}
            </span>
          </div>
          <h1 className="font-display text-3xl font-extrabold mb-1">
            {signup ? 'Create your account' : 'Log in to continue'}
          </h1>
          <p className="text-sm text-muted mb-7">
            {signup ? 'Start your diagnostic — no card needed.' : 'Pick up right where you left off.'}
          </p>

          {/* Google */}
          <button onClick={quickGoogle} className="btn-ghost w-full py-3 gap-3 mb-5 hover:border-brand-400 hover:bg-brand-500/5">
            <Chrome size={18} className="text-brand-500" /> Continue with Google
          </button>

          <div className="flex items-center gap-3 text-xs text-muted mb-5">
            <div className="h-px flex-1 bg-[rgb(var(--border))]" /> or email <div className="h-px flex-1 bg-[rgb(var(--border))]" />
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            {signup && (
              <>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-muted" />
                  <input className="input pl-10" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['student', 'parent'] as const).map((r) => (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      className={`rounded-xl border py-2.5 text-sm font-semibold capitalize transition-all ${
                        role === r
                          ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300 shadow-glow'
                          : 'border-[rgb(var(--border))] text-muted hover:border-brand-400'
                      }`}
                    >
                      {r === 'student' ? '🎓' : '👨‍👩‍👧'} {r}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3 text-muted" />
              <input className="input pl-10" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3 text-muted" />
              <input className="input pl-10" type="password" placeholder="Password" defaultValue="demo1234" />
            </div>
            <motion.button
              type="submit"
              className="btn-primary w-full py-3 text-base"
              whileTap={{ scale: 0.97 }}
            >
              {signup ? 'Create account' : 'Log in'} <ArrowRight size={17} />
            </motion.button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            {signup ? (
              <>Already have an account? <Link to="/login" className="font-bold text-brand-600 hover:text-brand-500">Log in</Link></>
            ) : (
              <>New here? <Link to="/signup" className="font-bold text-brand-600 hover:text-brand-500">Create a free account</Link></>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
