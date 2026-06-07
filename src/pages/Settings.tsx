import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Card, SectionTitle, Pill } from '@/components/ui';
import { User, Target, Clock, Calendar, Moon, Sun, Trash2, LogOut, Bell } from 'lucide-react';

export default function Settings() {
  const { user, updateProfile, theme, setTheme, resetAll } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? '');
  const [target, setTarget] = useState(user?.targetScore ?? 1450);
  const [hours, setHours] = useState(user?.studyHoursPerDay ?? 1);
  const [testDate, setTestDate] = useState(user?.testDate ?? '');
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateProfile({ name, targetScore: target, studyHoursPerDay: hours, testDate });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <SectionTitle title="Settings" subtitle="Manage your profile, goals, and preferences." />

      <Card>
        <h3 className="font-display font-bold mb-4 flex items-center gap-2"><User size={18} className="text-brand-500" /> Profile</h3>
        <div className="space-y-4">
          <Field label="Name">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email">
            <input className="input" value={user?.email ?? ''} disabled />
          </Field>
          <Field label="Account type">
            <Pill tone="brand" className="capitalize">{user?.role ?? 'student'}</Pill>
          </Field>
        </div>
      </Card>

      <Card>
        <h3 className="font-display font-bold mb-4 flex items-center gap-2"><Target size={18} className="text-brand-500" /> Goals</h3>
        <div className="space-y-4">
          <Field label={`Target score: ${target}`} icon={<Target size={14} />}>
            <input type="range" min={1000} max={1600} step={10} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="w-full accent-brand-600" />
          </Field>
          <Field label="Study hours per day" icon={<Clock size={14} />}>
            <div className="grid grid-cols-4 gap-2">
              {[0.5, 1, 1.5, 2].map((h) => (
                <button key={h} onClick={() => setHours(h)} className={`rounded-xl border py-2 text-sm ${hours === h ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600' : 'surface'}`}>{h}h</button>
              ))}
            </div>
          </Field>
          <Field label="Test date" icon={<Calendar size={14} />}>
            <input type="date" className="input" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
          </Field>
        </div>
        <button className="btn-primary mt-5 px-6 py-2.5" onClick={save}>
          {saved ? '✓ Saved' : 'Save changes'}
        </button>
      </Card>

      <Card>
        <h3 className="font-display font-bold mb-4 flex items-center gap-2"><Bell size={18} className="text-brand-500" /> Preferences</h3>
        <div className="flex items-center justify-between rounded-xl border surface p-4">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            <div>
              <div className="text-sm font-medium">Appearance</div>
              <div className="text-xs text-muted">Switch between light and dark mode</div>
            </div>
          </div>
          <button className="btn-ghost px-4 py-2 text-sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          </button>
        </div>
      </Card>

      <Card className="border-danger/30">
        <h3 className="font-display font-bold mb-2 text-danger flex items-center gap-2"><Trash2 size={18} /> Danger zone</h3>
        <p className="text-sm text-muted mb-4">Reset all progress and data, or log out of your account.</p>
        <div className="flex flex-wrap gap-3">
          <button
            className="btn-ghost px-4 py-2 text-sm text-danger border-danger/30"
            onClick={() => {
              if (confirm('Reset ALL progress and data? This cannot be undone.')) {
                resetAll();
                navigate('/');
              }
            }}
          >
            <Trash2 size={15} /> Reset all data
          </button>
          <button className="btn-ghost px-4 py-2 text-sm" onClick={() => { useStore.getState().logout(); navigate('/'); }}>
            <LogOut size={15} /> Log out
          </button>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">{icon} {label}</label>
      {children}
    </div>
  );
}
