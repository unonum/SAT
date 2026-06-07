import { cn, masteryColor } from '@/lib/utils';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/* ── Card ── */
export function Card({ className, children, glow }: { className?: string; children: ReactNode; glow?: boolean }) {
  return (
    <div className={cn(glow ? 'card-glow' : 'card', 'p-5', className)}>
      {children}
    </div>
  );
}

/* ── Section title ── */
export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Stat card ── */
export function Stat({
  label,
  value,
  sub,
  icon,
  accent = 'brand',
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
  accent?: 'brand' | 'success' | 'warning' | 'danger' | 'accent' | 'violet';
}) {
  const accentMap = {
    brand:   { bg: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',  border: 'border-brand-500/20' },
    success: { bg: 'bg-success/10 text-success',                           border: 'border-success/20' },
    warning: { bg: 'bg-warning/10 text-warning',                           border: 'border-warning/20' },
    danger:  { bg: 'bg-danger/10 text-danger',                             border: 'border-danger/20' },
    accent:  { bg: 'bg-accent-500/10 text-accent-600 dark:text-accent-400', border: 'border-accent-500/20' },
    violet:  { bg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', border: 'border-violet-500/20' },
  }[accent];

  return (
    <div className={cn('card flex items-center gap-4 p-4 border', accentMap.border)}>
      {icon && (
        <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', accentMap.bg)}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xs font-medium text-muted truncate">{label}</div>
        <div className="font-display text-2xl font-bold leading-tight tracking-tight">{value}</div>
        {sub && <div className="text-xs text-muted truncate mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

/* ── Progress ring ── */
export function ProgressRing({
  value,
  size = 88,
  stroke = 8,
  color,
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: ReactNode;
  sublabel?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = c - (clamped / 100) * c;
  const col = color ?? masteryColor(value);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
          className="stroke-slate-200 dark:stroke-slate-700" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={stroke}
          stroke={col}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 ${stroke}px ${col}55)` }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display font-bold leading-none" style={{ fontSize: size / 4.5 }}>
          {label ?? `${Math.round(value)}%`}
        </div>
        {sublabel && <div className="text-[10px] text-muted mt-0.5">{sublabel}</div>}
      </div>
    </div>
  );
}

/* ── Mastery bar ── */
export function MasteryBar({ value, height = 8 }: { value: number; height?: number }) {
  return (
    <div className="w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden" style={{ height }}>
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        style={{
          background: masteryColor(value),
          boxShadow: `0 0 6px ${masteryColor(value)}66`,
        }}
      />
    </div>
  );
}

/* ── Pill / chip ── */
export function Pill({
  children,
  tone = 'brand',
  className,
}: {
  children: ReactNode;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'muted' | 'violet';
  className?: string;
}) {
  const tones = {
    brand:   'bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    danger:  'bg-danger/10 text-danger border border-danger/20',
    muted:   'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/15',
    violet:  'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20',
  };
  return <span className={cn('chip', tones[tone], className)}>{children}</span>;
}

/* ── Empty state ── */
export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <Card className="text-center py-14">
      <div className="text-5xl mb-4">🗂️</div>
      <h3 className="font-display font-bold text-xl">{title}</h3>
      {hint && <p className="text-sm text-muted mt-2 max-w-sm mx-auto leading-relaxed">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
