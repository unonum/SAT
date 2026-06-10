import { Link } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Target, Check, ArrowLeft, Sparkles, Zap, Shield, Users } from 'lucide-react';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Everything you need to get started.',
    icon: <Sparkles size={22} />,
    grad: 'from-slate-500 to-slate-600',
    features: ['Smart diagnostic test', 'Daily adaptive practice (limited)', 'Basic weakness dashboard', 'AI tutor explanations', 'Streaks & XP gamification'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    desc: 'The full AI coaching experience.',
    icon: <Zap size={22} />,
    grad: 'from-brand-500 to-accent-500',
    features: ['Unlimited adaptive practice', 'Full weakness lab & heatmaps', 'Auto-rebuilding study plan', 'Unlimited mock tests', 'Weekly AI progress reports', 'All 9 practice modes', 'Priority AI tutor'],
    cta: 'Go Pro',
    highlight: true,
  },
  {
    name: 'Family',
    price: '$29',
    period: '/month',
    desc: 'For families and tutors.',
    icon: <Users size={22} />,
    grad: 'from-violet-500 to-brand-500',
    features: ['Everything in Pro', 'Up to 3 students', 'Parent / tutor dashboard', 'Weekly email reports', 'Tutor session notes', 'Priority support'],
    cta: 'Choose Family',
    highlight: false,
  },
];

export default function Pricing() {
  const user = useStore((s) => s.user);
  return (
    <div className="min-h-screen mesh-bg">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl bg-white/60 dark:bg-black/40">
        <div className="mx-auto flex max-w-7xl items-center px-5 py-3.5 sm:px-8">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted hover:text-brand-500 transition-colors">
            <ArrowLeft size={15} /> Back
          </Link>
          <div className="mx-auto flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-brand text-white shadow-glow">
              <Target size={16} />
            </div>
            <span className="font-display font-extrabold">Target<span className="gradient-text">1550</span></span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-300">
            <Sparkles size={13} /> Simple, honest pricing
          </div>
          <h1 className="font-display text-5xl font-extrabold sm:text-6xl tracking-tight">
            Invest in your <span className="gradient-text">score</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted text-lg">
            Start free. Upgrade for the full AI coaching experience. Cancel anytime.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid gap-6 lg:grid-cols-3 items-start">
          {PLANS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`relative ${p.highlight ? 'lg:-mt-4' : ''}`}
            >
              {p.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <span className="rounded-full bg-gradient-brand px-4 py-1 text-xs font-bold text-white shadow-glow">Most popular</span>
                </div>
              )}
              <div className={`card h-full p-7 flex flex-col ${p.highlight ? 'ring-2 ring-brand-500 shadow-glow-lg' : ''}`}>
                <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${p.grad} text-white shadow-soft`}>
                  {p.icon}
                </div>
                <h3 className="font-display text-2xl font-extrabold">{p.name}</h3>
                <p className="text-sm text-muted mt-1">{p.desc}</p>
                <div className="mt-5 flex items-end gap-1.5 mb-6">
                  <span className="font-display text-5xl font-extrabold">{p.price}</span>
                  <span className="text-muted mb-1.5 text-lg">{p.period}</span>
                </div>
                <ul className="flex-1 space-y-3 mb-7">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check size={16} className="text-success shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={user ? '/app' : '/signup'}
                  className={p.highlight ? 'btn-primary w-full py-3.5 text-center' : 'btn-ghost w-full py-3.5 text-center'}
                >
                  {p.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Guarantee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2.5 rounded-2xl border border-success/20 bg-success/5 px-6 py-3 text-sm text-success">
            <Shield size={17} /> 14-day money-back guarantee · No hidden fees · Cancel anytime
          </div>
        </motion.div>
      </div>
    </div>
  );
}
