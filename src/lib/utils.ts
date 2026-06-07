import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function masteryColor(m: number): string {
  if (m >= 85) return '#16a34a';
  if (m >= 70) return '#3563ff';
  if (m >= 50) return '#f59e0b';
  return '#ef4444';
}

export function masteryLabel(m: number): string {
  if (m >= 85) return 'Mastered';
  if (m >= 70) return 'Proficient';
  if (m >= 50) return 'Developing';
  return 'Needs work';
}

export function relativeDate(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
