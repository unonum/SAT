import { Link } from 'react-router-dom';
import { useStore } from '@/lib/store';
import {
  Target,
  Brain,
  Gauge,
  CalendarCheck,
  Users,
  Sparkles,
  ArrowRight,
  Check,
  Sun,
  Moon,
  Zap,
  LineChart,
  Quote,
} from 'lucide-react';

export default function Landing() {
  const { theme, setTheme, user } = useStore();
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
              <Target size={20} />
            </div>
            <span className="font-display text-lg font-extrabold">Target1450</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
            <a href="#how" className="hover:text-brand-600">How it works</a>
            <a href="#features" className="hover:text-brand-600">Features</a>
            <a href="#parents" className="hover:text-brand-600">For parents</a>
            <Link to="/pricing" className="hover:text-brand-600">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost h-9 w-9 p-0"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user ? (
              <Link to="/app" className="btn-primary px-4 py-2 text-sm">Go to app</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost px-4 py-2 text-sm">Log in</Link>
                <Link to="/signup" className="btn-primary px-4 py-2 text-sm">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden grid-bg">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border surface px-4 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300 animate-fade-up">
            <Sparkles size={14} /> AI-powered adaptive SAT coaching
          </div>
          <h1 className="mx-auto max-w-4xl font-display text-4xl font-extrabold leading-[1.1] sm:text-6xl animate-fade-up">
            The AI SAT Coach that finds your{' '}
            <span className="gradient-text">weaknesses</span> and fixes them automatically.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted animate-fade-up">
            Target1450 studies every answer, your timing, and your confidence — then builds the exact
            next set of questions you need. No more random practice. Just your fastest path to your
            target score.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-up">
            <Link to="/signup" className="btn-primary px-7 py-3.5 text-base">
              Take the free diagnostic <ArrowRight size={18} />
            </Link>
            <Link to="/pricing" className="btn-ghost px-7 py-3.5 text-base">See pricing</Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
            <span className="flex items-center gap-1.5"><Check size={16} className="text-success" /> No credit card</span>
            <span className="flex items-center gap-1.5"><Check size={16} className="text-success" /> 8 SAT skill areas</span>
            <span className="flex items-center gap-1.5"><Check size={16} className="text-success" /> Personalized in minutes</span>
          </div>

          {/* Hero stat cards */}
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { v: '+180', l: 'avg. score lift' },
              { v: '8', l: 'skill areas tracked' },
              { v: '24/7', l: 'AI tutor access' },
              { v: '100%', l: 'personalized' },
            ].map((s) => (
              <div key={s.l} className="card p-4">
                <div className="font-display text-2xl font-extrabold gradient-text">{s.v}</div>
                <div className="text-xs text-muted mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHead
          eyebrow="How it works"
          title="From diagnostic to dream score in 3 steps"
          subtitle="Target1450 behaves like a personal coach, not a worksheet generator."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Gauge, t: '1. Smart diagnostic', d: 'A short adaptive test pinpoints your level across Math and Reading & Writing, plus your timing and accuracy under pressure.' },
            { icon: Brain, t: '2. AI builds your plan', d: 'We compute a mastery score for every topic and generate the next best questions — concentrated on what is actually holding you back.' },
            { icon: LineChart, t: '3. Improve daily', d: 'Daily adaptive practice, AI explanations for every miss, and a dashboard that shows your score climbing week over week.' },
          ].map((s) => (
            <div key={s.t} className="card p-6">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300 mb-4">
                <s.icon size={24} />
              </div>
              <h3 className="font-display text-lg font-bold">{s.t}</h3>
              <p className="text-sm text-muted mt-2 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y surface/50 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionHead
            eyebrow="Everything in one place"
            title="A complete prep platform, powered by AI"
            subtitle="Adaptive testing, AI tutoring, gamification, analytics, and daily coaching."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Target, t: 'Adaptive question engine', d: 'Weak topics get exponentially more practice until you improve. Mastery below 50% triggers concept-repair mode.' },
              { icon: Brain, t: 'AI SAT tutor', d: 'Every missed question gets a friendly breakdown: why you missed it, the fastest strategy, traps, and a simpler view.' },
              { icon: Zap, t: 'Daily feedback & streaks', d: 'A personalized daily message, score estimate, and the next step — designed to keep you coming back.' },
              { icon: Gauge, t: 'Weakness dashboard', d: 'Topic mastery, accuracy heatmaps, timing, and a live score projection toward your goal.' },
              { icon: CalendarCheck, t: 'Auto study plan', d: 'A plan that rebuilds itself every day around your weakest topics, test date, and study hours.' },
              { icon: Users, t: 'Parent / tutor view', d: 'A clean summary of effort, progress, weak spots, and weekly reports — simple enough for parents.' },
            ].map((f) => (
              <div key={f.t} className="card p-6 hover:shadow-glow transition-shadow">
                <f.icon size={22} className="text-brand-500 mb-3" />
                <h3 className="font-display font-bold">{f.t}</h3>
                <p className="text-sm text-muted mt-1.5 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Parents */}
      <section id="parents" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHead
              eyebrow="For parents & tutors"
              title="See real progress, not just hours logged"
              align="left"
            />
            <ul className="space-y-3">
              {[
                'Daily effort and study consistency tracker',
                'Estimated SAT score and weekly change',
                'Clear weak areas and recommended support',
                'Automatic weekly AI progress reports',
              ].map((x) => (
                <li key={x} className="flex items-start gap-3 text-sm">
                  <Check size={18} className="text-success shrink-0 mt-0.5" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            <Link to="/signup" className="btn-primary mt-7 px-6 py-3">
              Start free <ArrowRight size={16} />
            </Link>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold mb-4">Weekly summary · sample</div>
            <div className="space-y-3 text-sm">
              <Row k="Estimated score" v="1320 (+40)" tone="success" />
              <Row k="Questions this week" v="142" />
              <Row k="Accuracy" v="74%" />
              <Row k="Strongest" v="Algebra" />
              <Row k="Needs focus" v="Geometry & Trig" tone="warning" />
              <Row k="Study streak" v="6 days 🔥" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y surface/50 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionHead eyebrow="Loved by students" title="Real results, real motivation" />
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { q: 'It actually knew I was bad at punctuation before I did. My RW score jumped 90 points.', n: 'Maya R.', s: '1190 → 1410' },
              { q: 'The AI tutor explains things better than my prep book. And it’s not boring.', n: 'Devon K.', s: '1050 → 1280' },
              { q: 'The daily streaks got me to practice every single day. That was the whole game.', n: 'Aisha P.', s: '1320 → 1500' },
            ].map((t) => (
              <div key={t.n} className="card p-6">
                <Quote size={20} className="text-brand-400 mb-3" />
                <p className="text-sm leading-relaxed">“{t.q}”</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold">{t.n}</span>
                  <span className="chip bg-success/10 text-success">{t.s}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-accent-600 px-8 py-16 text-center text-white">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Ready to hit your target score?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Take the free diagnostic and get your personalized study plan in minutes.
          </p>
          <Link to="/signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-semibold text-brand-700 hover:bg-white/90">
            Get started free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Target size={18} className="text-brand-500" /> Target1450
          </div>
          <p className="text-xs text-muted">© {new Date().getFullYear()} Target1450. A demo SAT prep platform.</p>
        </div>
      </footer>
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  subtitle,
  align = 'center',
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
}) {
  return (
    <div className={`mb-12 ${align === 'center' ? 'text-center mx-auto max-w-2xl' : ''}`}>
      <div className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">{eyebrow}</div>
      <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-muted">{subtitle}</p>}
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: 'success' | 'warning' }) {
  return (
    <div className="flex items-center justify-between border-b surface pb-2 last:border-0">
      <span className="text-muted">{k}</span>
      <span className={`font-semibold ${tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : ''}`}>{v}</span>
    </div>
  );
}
