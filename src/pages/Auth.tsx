import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Target, Mail, Lock, User, ArrowRight, Chrome } from 'lucide-react';

export default function Auth({ signup }: { signup?: boolean }) {
  const navigate = useNavigate();
  const { signup: doSignup, user, hasDiagnostic } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'student' | 'parent'>('student');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (signup || !user) {
      doSignup({
        name: name || 'SAT Student',
        email: email || 'student@example.com',
        role,
        targetScore: 1450,
        studyHoursPerDay: 1,
      });
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
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 to-accent-600 p-10 text-white lg:flex grid-bg">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20">
            <Target size={20} />
          </div>
          <span className="font-display text-lg font-extrabold">Target1450</span>
        </Link>
        <div>
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            Your personal AI SAT coach is ready.
          </h2>
          <p className="mt-4 max-w-md text-white/80">
            Sign up, take a quick diagnostic, and get a study plan built around exactly what you need
            to improve.
          </p>
        </div>
        <div className="text-sm text-white/70">“Finds your weaknesses and fixes them automatically.”</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
              <Target size={20} />
            </div>
            <span className="font-display text-lg font-extrabold">Target1450</span>
          </Link>

          <h1 className="font-display text-2xl font-bold">{signup ? 'Create your account' : 'Welcome back'}</h1>
          <p className="mt-1 text-sm text-muted">
            {signup ? 'Start with a free diagnostic — no card needed.' : 'Log in to continue your prep.'}
          </p>

          <button onClick={quickGoogle} className="btn-ghost mt-6 w-full py-2.5">
            <Chrome size={18} /> Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /> or <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {signup && (
              <>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-muted" />
                  <input className="input pl-10" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['student', 'parent'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`rounded-xl border py-2.5 text-sm font-medium capitalize transition-colors ${
                        role === r ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'surface'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3 text-muted" />
              <input className="input pl-10" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3 text-muted" />
              <input className="input pl-10" type="password" placeholder="Password" defaultValue="demo1234" />
            </div>
            <button type="submit" className="btn-primary w-full py-2.5">
              {signup ? 'Create account' : 'Log in'} <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            {signup ? (
              <>Already have an account? <Link to="/login" className="font-semibold text-brand-600">Log in</Link></>
            ) : (
              <>New here? <Link to="/signup" className="font-semibold text-brand-600">Create an account</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
