import { Link } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import {
  Target, Brain, Gauge, CalendarCheck, Users, Sparkles, ArrowRight,
  Check, Sun, Moon, Zap, LineChart, Quote, Trophy, Flame, Shield,
} from 'lucide-react';

/* ─ Animation helpers ─ */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
});

export default function Landing() {
  const { theme, setTheme, user } = useStore();
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl bg-white/60 dark:bg-black/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 select-none">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-white shadow-glow">
              <Target size={20} />
            </div>
            <span className="font-display text-lg font-extrabold">Target<span className="gradient-text">1450</span></span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
            {[['#how', 'How it works'], ['#features', 'Features'], ['#parents', 'Parents'], ['/pricing', 'Pricing']].map(([href, label]) =>
              href.startsWith('/') ? (
                <Link key={label} to={href} className="hover:text-brand-500 transition-colors">{label}</Link>
              ) : (
                <a key={label} href={href} className="hover:text-brand-500 transition-colors">{label}</a>
              )
            )}
          </nav>
          <div className="flex items-center gap-2">
            <button className="btn-ghost h-9 w-9 p-0" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {user ? (
              <Link to="/app" className="btn-primary px-4 py-2 text-sm">Dashboard <ArrowRight size={14} /></Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost px-4 py-2 text-sm hidden sm:inline-flex">Log in</Link>
                <Link to="/signup" className="btn-primary px-4 py-2 text-sm">Get started free <ArrowRight size={14} /></Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Mesh + orbs */}
        <div className="absolute inset-0 mesh-bg" />
        <div className="orb w-[600px] h-[600px] bg-brand-500/20 dark:bg-brand-500/30 -top-32 -left-32" style={{ animationDelay: '0s' }} />
        <div className="orb w-[500px] h-[500px] bg-accent-500/15 dark:bg-accent-500/25 top-20 -right-40" style={{ animationDelay: '3s' }} />
        <div className="orb w-[300px] h-[300px] bg-violet-500/10 dark:bg-violet-500/20 bottom-0 left-1/3" style={{ animationDelay: '1.5s' }} />

        <div className="relative z-10 mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 text-center">
          <motion.div {...fadeUp(0)} className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 dark:bg-brand-500/20 px-4 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-300 backdrop-blur-sm">
            <Sparkles size={13} className="animate-bounce-subtle" /> New: AI concept-repair mode is live
          </motion.div>

          <motion.h1 {...fadeUp(0.08)} className="mx-auto max-w-5xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
            The AI SAT Coach that finds your{' '}
            <span className="relative">
              <span className="gradient-text">weaknesses</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M4 8 Q150 0 296 8" stroke="url(#ul)" strokeWidth="3" strokeLinecap="round"/>
                <defs><linearGradient id="ul" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#3563ff"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
              </svg>
            </span>{' '}
            and fixes them.
          </motion.h1>

          <motion.p {...fadeUp(0.16)} className="mx-auto mt-7 max-w-2xl text-xl text-muted leading-relaxed">
            Target1450 studies every answer, your timing, and your confidence — then builds the
            exact questions you need. No noise. Just your fastest path to your target score.
          </motion.p>

          <motion.div {...fadeUp(0.24)} className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link to="/signup" className="btn-primary px-8 py-4 text-base gap-3 animate-pulse-glow">
              <Sparkles size={18} /> Take the free diagnostic
              <ArrowRight size={18} />
            </Link>
            <Link to="/pricing" className="btn-ghost px-7 py-4 text-base">See pricing</Link>
          </motion.div>

          <motion.div {...fadeUp(0.3)} className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm text-muted">
            {['No credit card needed', '8 SAT skill areas', 'Score estimate in minutes', '100% personalized'].map((t) => (
              <span key={t} className="flex items-center gap-1.5"><Check size={15} className="text-neon-green" /> {t}</span>
            ))}
          </motion.div>

          {/* Hero stat cards */}
          <motion.div {...fadeUp(0.38)} className="mx-auto mt-16 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { v: '+180', l: 'avg score lift', icon: '📈' },
              { v: '8', l: 'skill areas', icon: '🎯' },
              { v: '24/7', l: 'AI tutor', icon: '🤖' },
              { v: '100%', l: 'adaptive', icon: '✨' },
            ].map((s) => (
              <div key={s.l} className="card-glow p-4 rounded-2xl text-center hover:scale-105 transition-transform duration-300">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="font-display text-2xl font-extrabold gradient-text">{s.v}</div>
                <div className="text-xs text-muted mt-0.5">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHead eyebrow="How it works" title="Your fastest path from where you are to where you want to be." />
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: '01', icon: Gauge, title: 'Smart diagnostic', desc: 'A short adaptive test pinpoints your level across all 8 SAT skill areas — measuring accuracy, timing, and pressure performance.', color: 'from-brand-500 to-brand-600' },
              { step: '02', icon: Brain, title: 'AI builds your plan', desc: 'We score your mastery per topic and generate the next best questions — concentrated on exactly what holds your score back.', color: 'from-accent-500 to-brand-500' },
              { step: '03', icon: LineChart, title: 'Score climbs daily', desc: 'Daily adaptive practice, full AI explanations for every miss, and a live dashboard showing your score trend week over week.', color: 'from-violet-500 to-accent-500' },
            ].map((s, i) => (
              <motion.div key={s.step} {...fadeUp(i * 0.1)} className="relative group">
                <div className="card p-7 h-full hover:shadow-glow transition-all duration-300 group-hover:-translate-y-1">
                  <div className="absolute top-5 right-5 font-display text-6xl font-extrabold text-slate-100 dark:text-slate-800 select-none">{s.step}</div>
                  <div className={`mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-glow`}>
                    <s.icon size={26} />
                  </div>
                  <h3 className="font-display text-xl font-bold">{s.title}</h3>
                  <p className="mt-2.5 text-sm text-muted leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-violet-500/5 dark:from-brand-500/10 dark:to-violet-500/10" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHead eyebrow="Everything you need" title="A complete AI prep platform — nothing bolted on." subtitle="Adaptive testing · AI tutoring · Gamification · Deep analytics · Daily coaching" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Target, title: 'Adaptive engine', desc: 'Weak topics get exponentially more practice. Below 50% mastery → concept-repair mode with guided fundamentals.', grad: 'from-brand-500 to-brand-600' },
              { icon: Brain, title: 'AI SAT tutor', desc: 'Every miss gets a breakdown: why wrong, fastest strategy, simpler view, traps, time tricks, personalized tip.', grad: 'from-violet-500 to-brand-500' },
              { icon: Zap, title: 'Daily feedback', desc: 'A coach-style daily message, live score estimate, streaks, and the exact next step to take.', grad: 'from-warning to-orange-500' },
              { icon: Gauge, title: 'Weakness dashboard', desc: 'Topic mastery radar, accuracy heatmaps, timing analysis, and a score projection toward your goal.', grad: 'from-accent-500 to-brand-500' },
              { icon: CalendarCheck, title: 'Auto study plan', desc: 'Rebuilds every day around your weakest topics, test date, and available study hours.', grad: 'from-neon-green to-accent-500' },
              { icon: Users, title: 'Parent / tutor view', desc: 'A clean summary of effort, progress, weak spots, and AI weekly reports — simple enough for parents.', grad: 'from-brand-500 to-violet-500' },
            ].map((f, i) => (
              <motion.div key={f.title} {...fadeUp(i * 0.07)}>
                <div className="card p-6 h-full group hover:shadow-glow hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                  <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${f.grad} text-white shadow-soft`}>
                    <f.icon size={22} />
                  </div>
                  <h3 className="font-display font-bold text-lg">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MASTERY FORMULA CALLOUT */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <motion.div {...fadeUp(0)} className="relative overflow-hidden rounded-3xl bg-gradient-brand p-px shadow-glow-lg">
            <div className="rounded-3xl bg-gradient-to-br from-brand-950 to-slate-900 p-8 sm:p-12">
              <div className="grid gap-8 lg:grid-cols-2 items-center">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-3">The adaptive algorithm</div>
                  <h2 className="font-display text-3xl font-extrabold text-white leading-tight">Built like a real coach's instinct. But faster.</h2>
                  <p className="mt-3 text-slate-400 leading-relaxed">
                    Every topic gets a live mastery score. When it dips, the engine floods your session with that topic until it climbs.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {[`Accuracy ×40%`, `Speed ×20%`, `Difficulty ×20%`, `Consistency ×10%`, `Improvement ×10%`].map((t) => (
                      <span key={t} className="chip bg-brand-500/20 text-brand-200 border border-brand-500/30">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="font-mono text-sm space-y-2 bg-black/40 rounded-2xl p-5 border border-brand-500/20">
                  <div className="text-slate-500 text-xs mb-3">// mastery_score(topic)</div>
                  <div><span className="text-accent-400">accuracy</span>    <span className="text-slate-500">×</span> <span className="text-neon-green">0.40</span></div>
                  <div><span className="text-violet-400">time_eff</span>    <span className="text-slate-500">×</span> <span className="text-neon-green">0.20</span></div>
                  <div><span className="text-brand-300">difficulty</span>   <span className="text-slate-500">×</span> <span className="text-neon-green">0.20</span></div>
                  <div><span className="text-warning">consistency</span>  <span className="text-slate-500">×</span> <span className="text-neon-green">0.10</span></div>
                  <div><span className="text-neon-pink">improvement</span> <span className="text-slate-500">×</span> <span className="text-neon-green">0.10</span></div>
                  <div className="border-t border-brand-500/20 pt-2 text-white font-bold">= mastery <span className="text-brand-300">0–100</span></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PARENTS */}
      <section id="parents" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div {...fadeUp(0)}>
              <div className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-3">For parents & tutors</div>
              <h2 className="font-display text-4xl font-extrabold leading-tight">See real progress, not just time logged.</h2>
              <p className="mt-4 text-muted">Clear metrics, weekly AI reports, and recommended actions — so you can actually help.</p>
              <ul className="mt-7 space-y-3.5">
                {['Estimated SAT score updated daily', 'Effort tracker + missed practice alerts', 'Topic-level mastery breakdown', 'Weekly AI-generated progress reports', 'Recommended parent support actions'].map((x) => (
                  <li key={x} className="flex items-start gap-3">
                    <Shield size={18} className="text-success shrink-0 mt-0.5" />
                    <span className="text-sm">{x}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="btn-primary mt-8 inline-flex px-7 py-3.5">Start free <ArrowRight size={16} /></Link>
            </motion.div>

            <motion.div {...fadeUp(0.1)}>
              <div className="card-glow p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-xs text-muted">Weekly summary</div>
                    <div className="font-display font-bold text-lg">Alex Chen · Week 4</div>
                  </div>
                  <span className="chip bg-success/10 text-success">+40 pts 📈</span>
                </div>
                <div className="space-y-3">
                  {[
                    { k: 'Estimated score', v: '1,320', tone: 'text-brand-600 dark:text-brand-300' },
                    { k: 'Questions this week', v: '142', tone: '' },
                    { k: 'Accuracy', v: '74%', tone: '' },
                    { k: 'Study streak', v: '6 days 🔥', tone: 'text-orange-500' },
                    { k: 'Strongest', v: 'Algebra', tone: 'text-success' },
                    { k: 'Focus needed', v: 'Geometry', tone: 'text-warning' },
                  ].map((r) => (
                    <div key={r.k} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0 text-sm">
                      <span className="text-muted">{r.k}</span>
                      <span className={`font-semibold ${r.tone}`}>{r.v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20 p-3 text-xs text-brand-700 dark:text-brand-300">
                  💡 Recommended: encourage 20 min of Geometry practice tomorrow.
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* GAMIFICATION */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-violet-500/5 to-accent-500/5" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 text-center">
          <SectionHead eyebrow="Stay motivated" title="Practice that feels like a game, not a chore." />
          <div className="flex flex-wrap justify-center gap-5 mt-4">
            {[
              { icon: '🔥', t: 'Daily streaks', c: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
              { icon: '⚡', t: 'XP + levels', c: 'bg-brand-500/10 text-brand-600 dark:text-brand-300' },
              { icon: '🏆', t: 'Badges', c: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
              { icon: '🎯', t: 'Topic mastery', c: 'bg-success/10 text-success' },
              { icon: '🚀', t: 'Score milestones', c: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
              { icon: '💪', t: 'Weekly challenges', c: 'bg-accent-500/10 text-accent-600 dark:text-accent-400' },
            ].map((g) => (
              <div key={g.t} className={`flex items-center gap-2.5 rounded-2xl border border-current/20 px-5 py-3 font-semibold text-sm ${g.c} hover:scale-105 transition-transform`}>
                <span className="text-2xl">{g.icon}</span> {g.t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHead eyebrow="Student results" title="Real scores. Real motivation." />
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { q: 'It figured out I was bad at punctuation before I did. My RW score jumped 90 points.', n: 'Maya R.', g: '11th grade', s: '1190 → 1410', c: 'from-brand-500 to-accent-500' },
              { q: 'The AI tutor explains things better than my prep book. And it\'s actually encouraging.', n: 'Devon K.', g: '12th grade', s: '1050 → 1280', c: 'from-violet-500 to-brand-500' },
              { q: 'The daily streaks got me to practice every single day. That was the whole game.', n: 'Aisha P.', g: '11th grade', s: '1320 → 1500', c: 'from-warning to-orange-500' },
            ].map((t, i) => (
              <motion.div key={t.n} {...fadeUp(i * 0.1)}>
                <div className="card p-7 h-full hover:shadow-glow hover:-translate-y-0.5 transition-all duration-300">
                  <Quote size={22} className="text-brand-400 mb-4" />
                  <p className="text-sm leading-relaxed flex-1">"{t.q}"</p>
                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{t.n}</div>
                      <div className="text-xs text-muted">{t.g}</div>
                    </div>
                    <div className={`chip bg-gradient-to-r ${t.c} text-white`}>{t.s}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <motion.div {...fadeUp(0)} className="relative overflow-hidden rounded-4xl text-center">
            <div className="absolute inset-0 bg-gradient-brand opacity-95" />
            <div className="orb w-96 h-96 bg-white/10 -top-20 -left-20" style={{ animationDelay: '0s' }} />
            <div className="orb w-80 h-80 bg-white/10 -bottom-10 -right-20" style={{ animationDelay: '2s' }} />
            <div className="relative z-10 py-20 px-8">
              <Trophy size={40} className="mx-auto mb-4 text-yellow-300 animate-bounce-subtle" />
              <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white leading-tight">Ready to hit your target score?</h2>
              <p className="mx-auto mt-4 max-w-xl text-white/80 text-lg">Take the free diagnostic. Get your personalized plan. Start climbing.</p>
              <Link to="/signup" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-bold text-brand-700 hover:bg-white/90 hover:scale-105 transition-all shadow-xl">
                Start for free <ArrowRight size={18} />
              </Link>
              <div className="mt-5 flex flex-wrap justify-center gap-5 text-sm text-white/70">
                <span className="flex items-center gap-1.5"><Check size={15} /> No card needed</span>
                <span className="flex items-center gap-1.5"><Check size={15} /> Cancel anytime</span>
                <span className="flex items-center gap-1.5"><Check size={15} /> Free diagnostic included</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-white/40 dark:bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-brand text-white"><Target size={14} /></div>
            <span className="font-display font-extrabold">Target<span className="gradient-text">1450</span></span>
          </div>
          <nav className="flex gap-6 text-xs text-muted">
            <Link to="/pricing" className="hover:text-brand-500 transition-colors">Pricing</Link>
            <a href="#features" className="hover:text-brand-500 transition-colors">Features</a>
            <Link to="/login" className="hover:text-brand-500 transition-colors">Login</Link>
          </nav>
          <p className="text-xs text-muted">© {new Date().getFullYear()} Target1450</p>
        </div>
      </footer>
    </div>
  );
}

function SectionHead({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <motion.div {...fadeUp(0)} className="mb-14 text-center mx-auto max-w-3xl">
      <div className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">{eyebrow}</div>
      <h2 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl leading-tight">{title}</h2>
      {subtitle && <p className="mt-4 text-muted">{subtitle}</p>}
    </motion.div>
  );
}
