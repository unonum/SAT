# 🎯 Target1450 — The AI SAT Coach

**"The AI SAT Coach that finds your weaknesses and fixes them automatically."**

A premium, modern, AI-powered SAT prep web app. Target1450 behaves like a personal
coach: it studies every answer, your timing, and your confidence, then builds the
exact next set of practice questions you need to reach your target score.

This repository contains a **fully runnable front-end implementation** — adaptive
engine, mastery scoring, AI tutor, gamification, analytics, and all 16 pages — that
works entirely client-side with `localStorage` persistence (no backend or API keys
required to run the demo).

---

## 🚀 Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run preview  # serve the production build
```

The app opens on the landing page. Click **Get started → take the diagnostic**, and
the rest of the experience (dashboard, practice, weakness lab, study plan, reports)
unlocks and populates from your answers in real time.

---

## ✨ Features implemented

| Area | What it does |
|------|--------------|
| **Smart diagnostic** | One question per skill area; measures accuracy, timing & confidence, then estimates your SAT score. |
| **Adaptive engine** | Weights weak topics exponentially; matches difficulty to mastery; switches to concept-repair mode below 50%. |
| **AI SAT Tutor** | Per-question coaching: why you missed it, the correct reasoning, fastest strategy, simpler view, traps, time tricks, and a personalized improvement tip. |
| **Mastery scoring** | `Accuracy×40% + Time Efficiency×20% + Difficulty×20% + Consistency×10% + Recent Improvement×10%`. |
| **Daily feedback** | Personalized daily message, score estimate, accuracy, streak, and next-step recommendation. |
| **Weakness Lab** | Mastery radar, difficulty performance, topic heatmap, repeated-mistake analysis, urgent-attention list. |
| **Auto study plan** | Rolling 7-day plan that rebuilds around your weakest topics, test date, and study hours. |
| **Smart error log** | Every miss captured & auto-categorized (concept gap, misread, calculation, grammar, time pressure, guessing, trap) with re-attempt mode. |
| **Gamification** | XP, levels, streaks, and 8 unlockable badges. |
| **Practice modes** | Daily adaptive, topic, timed drill, speed challenge, weakness repair, mock test, error review, bootcamp, 7-day revision. |
| **Progress report** | Weekly AI report: score change, strengths, weaknesses, top mistake, focus, confidence, risk areas, parent action. |
| **Parent/Tutor dashboard** | Effort tracking, mastery, missed days, weekly summary & recommended support. |
| **Admin question bank** | Searchable/filterable library with per-question correct-rate stats and preview. |
| **Pricing & settings** | 3-tier pricing, profile/goals editor, light/dark mode, data reset. |

---

## 🧠 Adaptive logic

`src/lib/adaptive.ts` computes a **mastery score (0–100)** per topic from the formula
above, then `selectAdaptiveQuestions()` picks the next questions using inverse-mastery
weighting (squared in weakness mode) with difficulty matched to current mastery.
Score estimation maps section mastery to a 200–800 scale per section (400–1600 total).

`src/lib/tutor.ts` holds the **AI tutor layer**. It composes structured, encouraging
explanations deterministically so the demo works offline — returning the same shape an
LLM would. In production this layer calls an LLM with the question, the student's
answer, and their mastery profile.

---

## 🛠 Tech stack

- **React 18 + TypeScript + Vite**
- **Tailwind CSS** (custom design system, light/dark mode)
- **Zustand** (state + `localStorage` persistence)
- **Recharts** (analytics) · **Lucide** (icons)
- **React Router** (16 routed pages)

### Project structure

```
src/
  lib/            # domain logic (no UI)
    types.ts          # all domain types
    topics.ts         # 8 SAT skill areas
    questionBank.ts   # SAT-style questions + tutor content
    adaptive.ts       # mastery scoring + question selection + scoring
    tutor.ts          # AI tutor / daily feedback / weekly report
    gamification.ts   # XP, levels, streaks, badges
    studyPlan.ts      # rolling study-plan generator
    store.ts          # Zustand store w/ persistence
  components/
    ui/               # Card, Stat, ProgressRing, MasteryBar, Pill...
    layout/AppShell   # sidebar + topbar app shell
    QuestionRunner    # shared question/answer/tutor flow
  pages/            # 16 pages (Landing, Auth, Assessment, Dashboard, ...)
```

---

## 🏗 Production architecture (reference)

The client here is production-shaped. A full deployment would add:

- **Backend:** FastAPI (Python) or Node — auth, question bank, attempt ingestion, analytics.
- **Database:** PostgreSQL — `users`, `questions`, `attempts`, `topic_mastery`, `daily_stats`, `study_plans`, `subscriptions`.
- **Auth:** email + Google OAuth.
- **AI layer:** LLM-backed tutor & feedback engine (the `tutor.ts` interface maps 1:1).
- **Payments:** Stripe subscription module (Free / Pro / Family).
- **Deploy:** Vercel (frontend) + managed Postgres + serverless API.

---

*Demo project — questions are illustrative SAT-style items for showcasing the platform.*
