import { Link } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Target, Check, ArrowLeft, Sparkles } from 'lucide-react';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Everything you need to start improving.',
    features: ['Smart diagnostic test', 'Daily adaptive practice (limited)', 'Basic weakness dashboard', 'AI explanations', 'Streaks & XP'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    desc: 'The full AI coaching experience.',
    features: ['Unlimited adaptive practice', 'Full weakness lab & heatmaps', 'Auto study plan', 'Unlimited mock tests', 'Weekly AI progress reports', 'All practice modes', 'Priority AI tutor'],
    cta: 'Go Pro',
    highlight: true,
  },
  {
    name: 'Family',
    price: '$29',
    period: '/month',
    desc: 'For families and tutors.',
    features: ['Everything in Pro', 'Up to 3 students', 'Parent / tutor dashboard', 'Weekly email reports', 'Tutor session notes', 'Priority support'],
    cta: 'Choose Family',
    highlight: false,
  },
];

export default function Pricing() {
  const user = useStore((s) => s.user);
  return (
    <div className="min-h-screen grid-bg">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-brand-600">
          <ArrowLeft size={16} /> Back to home
        </Link>

        <div className="mt-10 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border surface px-4 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300">
            <Sparkles size={14} /> Simple, transparent pricing
          </div>
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">Invest in your score</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Start free. Upgrade when you're ready for the full AI coaching experience. Cancel anytime.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`card relative p-7 ${p.highlight ? 'ring-2 ring-brand-500 shadow-glow' : ''}`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
                  Most popular
                </div>
              )}
              <h3 className="font-display text-xl font-bold">{p.name}</h3>
              <p className="text-sm text-muted mt-1">{p.desc}</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="font-display text-4xl font-extrabold">{p.price}</span>
                <span className="text-muted mb-1">{p.period}</span>
              </div>
              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check size={17} className="text-success shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to={user ? '/app' : '/signup'}
                className={`mt-7 w-full py-3 ${p.highlight ? 'btn-primary' : 'btn-ghost'}`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted">
            <Target size={16} className="text-brand-500" /> 14-day money-back guarantee · No hidden fees
          </div>
        </div>
      </div>
    </div>
  );
}
