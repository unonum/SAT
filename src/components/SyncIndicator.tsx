import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, UploadCloud } from 'lucide-react';
import { onSyncChange, flushPending, type SyncStatus } from '@/lib/db';

/**
 * Live indicator of whether the user's attempts are safely synced to the DB.
 * Subscribes to the db sync bus so a silent local-only fallback is always
 * visible ("3 pending"), and lets the user force a retry.
 */
export default function SyncIndicator() {
  const [status, setStatus] = useState<SyncStatus>({ state: 'idle', pending: 0 });

  useEffect(() => onSyncChange(setStatus), []);

  const { state, pending } = status;

  if (state === 'offline') {
    return (
      <span className="chip border bg-slate-500/10 text-slate-500 border-slate-500/20" title="Running in local-only mode — DB not configured">
        <CloudOff size={13} /> <span className="hidden sm:inline">Local</span>
      </span>
    );
  }

  if (state === 'syncing') {
    return (
      <span className="chip border bg-brand-500/10 text-brand-600 border-brand-500/20">
        <RefreshCw size={13} className="animate-spin" /> <span className="hidden sm:inline">Syncing…</span>
      </span>
    );
  }

  if (state === 'pending') {
    return (
      <button
        onClick={() => void flushPending()}
        className="chip border bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20 transition"
        title={`${pending} attempt${pending === 1 ? '' : 's'} waiting to upload — click to retry now`}
      >
        <UploadCloud size={13} /> {pending} pending
      </button>
    );
  }

  // idle / all synced
  return (
    <span className="chip border bg-success/10 text-success border-success/20" title="All attempts synced to the database">
      <Cloud size={13} /> <span className="hidden sm:inline">Synced</span>
    </span>
  );
}
