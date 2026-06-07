import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Attempt,
  DailyStat,
  Gamification,
  PracticeMode,
  Question,
  UserProfile,
} from './types';
import { classifyMistake, estimateScore } from './adaptive';
import {
  evaluateBadges,
  todayStr,
  updateStreak,
  xpForAttempt,
} from './gamification';
import { computeAllMastery } from './adaptive';

interface AppState {
  user: UserProfile | null;
  hasDiagnostic: boolean;
  attempts: Attempt[];
  gamification: Gamification;
  daily: DailyStat[];
  theme: 'light' | 'dark';

  // actions
  signup: (u: Omit<UserProfile, 'createdAt'>) => void;
  logout: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  recordAttempt: (args: {
    question: Question;
    selected: 'A' | 'B' | 'C' | 'D' | null;
    timeSec: number;
    confidence: 'low' | 'medium' | 'high';
    mode: PracticeMode;
  }) => void;
  finishSession: (mode: PracticeMode, accuracy: number) => string[];
  markDiagnosticDone: () => void;
  retryAttempt: (attemptId: string) => void;
  setTheme: (t: 'light' | 'dark') => void;
  resetAll: () => void;
}

const initialGamification: Gamification = {
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: null,
  badges: [],
};

function applyTheme(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      hasDiagnostic: false,
      attempts: [],
      gamification: initialGamification,
      daily: [],
      theme:
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
          ? 'dark'
          : 'light',

      signup: (u) =>
        set({
          user: { ...u, createdAt: Date.now() },
        }),

      logout: () => set({ user: null }),

      updateProfile: (patch) =>
        set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),

      recordAttempt: ({ question, selected, timeSec, confidence, mode }) => {
        const correct = selected === question.correct;
        const attempt: Attempt = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          questionId: question.id,
          topic: question.topic,
          difficulty: question.difficulty,
          selected,
          correct,
          timeSec,
          confidence,
          ts: Date.now(),
          mode,
          mistakeCategory: correct ? undefined : classifyMistake(question, selected, timeSec),
        };

        set((s) => {
          const attempts = [...s.attempts, attempt];

          // XP + level
          const gainedXp = xpForAttempt(attempt);
          let g = updateStreak({ ...s.gamification, xp: s.gamification.xp + gainedXp });

          // daily stat
          const today = todayStr();
          const daily = [...s.daily];
          const idx = daily.findIndex((d) => d.date === today);
          const score = estimateScore(attempts).total;
          if (idx >= 0) {
            daily[idx] = {
              ...daily[idx],
              questions: daily[idx].questions + 1,
              correct: daily[idx].correct + (correct ? 1 : 0),
              timeSec: daily[idx].timeSec + timeSec,
              scoreEstimate: score,
            };
          } else {
            daily.push({
              date: today,
              questions: 1,
              correct: correct ? 1 : 0,
              timeSec,
              scoreEstimate: score,
            });
          }

          return { attempts, gamification: g, daily };
        });
      },

      finishSession: (mode, accuracy) => {
        const s = get();
        const mastery = computeAllMastery(s.attempts);
        const badges = evaluateBadges(s.gamification, s.attempts, mastery, accuracy);
        const newBadges = badges.filter((b) => !s.gamification.badges.includes(b));
        set({ gamification: { ...s.gamification, badges } });
        return newBadges;
      },

      markDiagnosticDone: () => set({ hasDiagnostic: true }),

      retryAttempt: (attemptId) =>
        set((s) => ({
          attempts: s.attempts.map((a) =>
            a.id === attemptId ? { ...a, retried: true } : a
          ),
        })),

      setTheme: (t) => {
        applyTheme(t);
        set({ theme: t });
      },

      resetAll: () =>
        set({
          user: null,
          hasDiagnostic: false,
          attempts: [],
          gamification: initialGamification,
          daily: [],
        }),
    }),
    {
      name: 't1450-store',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);
