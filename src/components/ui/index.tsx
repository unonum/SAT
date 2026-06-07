import { cn, masteryColor } from '@/lib/utils';
import type { ReactNode } from 'react';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('card p-5', className)}>{children}</div>;
}

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
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

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
  accent?: 'brand' | 'success' | 'warning' | 'danger' | 'accent';
}) {
  const accentBg = {
    brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    accent: 'bg-accent-500/10 text-accent-600',
  }[accent];
  return (
    <Card className="flex items-center gap-4">
      {icon && <div className={cn('grid h-11 w-11 place-items-center rounded-xl', accentBg)}>{icon}</div>}
      <div className="min-w-0">
        <div className="text-xs font-medium text-muted truncate">{label}</div>
        <div className="font-display text-2xl font-bold leading-tight">{value}</div>
        {sub && <div className="text-xs text-muted truncate">{sub}</div>}
      </div>
    </Card>
  );
}

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
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  const col = color ?? masteryColor(value);
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-200 dark:stroke-slate-700" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke={col}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
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

export function MasteryBar({ value, height = 8 }: { value: number; height?: number }) {
  return (
    <div className="w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden" style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, background: masteryColor(value) }}
      />
    </div>
  );
}

export function Pill({
  children,
  tone = 'brand',
  className,
}: {
  children: ReactNode;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'muted';
  className?: string;
}) {
  const tones = {
    brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    muted: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
  };
  return <span className={cn('chip', tones[tone], className)}>{children}</span>;
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <Card className="text-center py-12">
      <div className="text-4xl mb-3">🗂️</div>
      <h3 className="font-display font-bold text-lg">{title}</h3>
      {hint && <p className="text-sm text-muted mt-1 max-w-md mx-auto">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
