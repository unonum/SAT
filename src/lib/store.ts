import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Attempt,
  DailyStat,
  Gamification,
  PracticeMode,
  Question,
  UserProfile,
  UserData,
} from './types';
import { classifyMistake, estimateScore, computeAllMastery } from './adaptive';
import { evaluateBadges, todayStr, updateStreak, xpForAttempt } from './gamification';
import { isAdmin, STUDENT_EMAILS } from './auth';
import { rebuildFromAttempts } from './history';
import {
  pushAttempt,
  markRetried,
  fetchAttempts,
  fetchAttemptsForUsers,
  isRemoteEnabled,
} from './db';

interface AppState {
  // active session (mirrors profiles[currentEmail])
  currentEmail: string | null;
  user: UserProfile | null;
  hasDiagnostic: boolean;
  attempts: Attempt[];
  gamification: Gamification;
  daily: DailyStat[];

  // all known accounts on this browser (partitioned by email)
  profiles: Record<string, UserData>;

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

  // remote sync
  remoteEnabled: boolean;
  hydrateProfile: (email: string) => Promise<void>;
  hydrateStudents: () => Promise<void>;
}

/** Union two attempt lists by id (local + remote), preserving order by ts. */
function mergeAttempts(a: Attempt[], b: Attempt[]): Attempt[] {
  const map = new Map<string, Attempt>();
  for (const x of [...a, ...b]) map.set(x.id, x);
  return Array.from(map.values()).sort((x, y) => x.ts - y.ts);
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

/** Snapshot the active session back into the profiles map. */
function snapshotProfiles(s: AppState): Record<string, UserData> {
  if (!s.currentEmail) return s.profiles;
  return {
    ...s.profiles,
    [s.currentEmail]: {
      user: s.user,
      hasDiagnostic: s.hasDiagnostic,
      attempts: s.attempts,
      gamification: s.gamification,
      daily: s.daily,
      seeded: false,
    },
  };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentEmail: null,
      user: null,
      hasDiagnostic: false,
      attempts: [],
      gamification: initialGamification,
      daily: [],
      profiles: {},
      remoteEnabled: isRemoteEnabled,
      theme:
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
          ? 'dark'
          : 'light',

      signup: (u) =>
        set((s) => {
          // persist whatever the previous session had
          let profiles = snapshotProfiles(s);
          const email = u.email.trim().toLowerCase();
          const admin = isAdmin(email);

          // load existing profile or create a fresh one
          let pd: UserData = profiles[email] ?? {
            user: { ...u, email, role: admin ? 'admin' : 'student', createdAt: Date.now() },
            hasDiagnostic: false,
            attempts: [],
            gamification: initialGamification,
            daily: [],
            seeded: false,
          };
          // keep role correct, refresh name
          pd = { ...pd, user: { ...(pd.user as UserProfile), name: u.name, role: admin ? 'admin' : 'student' } };

          profiles = { ...profiles, [email]: pd };

          return {
            currentEmail: email,
            user: pd.user,
            hasDiagnostic: pd.hasDiagnostic,
            attempts: pd.attempts,
            gamification: pd.gamification,
            daily: pd.daily,
            profiles,
          };
        }),

      logout: () =>
        set((s) => ({
          profiles: snapshotProfiles(s),
          currentEmail: null,
          user: null,
          hasDiagnostic: false,
          attempts: [],
          gamification: initialGamification,
          daily: [],
        })),

      updateProfile: (patch) =>
        set((s) => {
          if (!s.user) return s;
          const user = { ...s.user, ...patch };
          return { user, profiles: snapshotProfiles({ ...s, user }) };
        }),

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
          const gainedXp = xpForAttempt(attempt);
          const gamification = updateStreak({ ...s.gamification, xp: s.gamification.xp + gainedXp });

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
            daily.push({ date: today, questions: 1, correct: correct ? 1 : 0, timeSec, scoreEstimate: score });
          }

          return { attempts, gamification, daily, profiles: snapshotProfiles({ ...s, attempts, gamification, daily }) };
        });

        // persist to DB (fire-and-forget)
        const email = get().currentEmail;
        if (email) void pushAttempt(email, attempt);
      },

      finishSession: (_mode, accuracy) => {
        const s = get();
        const mastery = computeAllMastery(s.attempts);
        const badges = evaluateBadges(s.gamification, s.attempts, mastery, accuracy);
        const newBadges = badges.filter((b) => !s.gamification.badges.includes(b));
        const gamification = { ...s.gamification, badges };
        set((st) => ({ gamification, profiles: snapshotProfiles({ ...st, gamification }) }));
        return newBadges;
      },

      markDiagnosticDone: () =>
        set((s) => ({ hasDiagnostic: true, profiles: snapshotProfiles({ ...s, hasDiagnostic: true }) })),

      retryAttempt: (attemptId) => {
        set((s) => {
          const attempts = s.attempts.map((a) => (a.id === attemptId ? { ...a, retried: true } : a));
          return { attempts, profiles: snapshotProfiles({ ...s, attempts }) };
        });
        void markRetried(attemptId);
      },

      setTheme: (t) => {
        applyTheme(t);
        set({ theme: t });
      },

      resetAll: () =>
        set((s) => {
          const profiles = { ...s.profiles };
          if (s.currentEmail) delete profiles[s.currentEmail];
          return {
            profiles,
            currentEmail: null,
            user: null,
            hasDiagnostic: false,
            attempts: [],
            gamification: initialGamification,
            daily: [],
          };
        }),

      // Pull a user's history from the DB and merge it into their profile.
      hydrateProfile: async (email) => {
        if (!isRemoteEnabled) return;
        const remote = await fetchAttempts(email);
        if (!remote.length) return;
        set((s) => {
          const existing = s.profiles[email]?.attempts ?? [];
          const attempts = mergeAttempts(existing, remote);
          const { daily, gamification } = rebuildFromAttempts(attempts);
          const prevUser = s.profiles[email]?.user ?? s.user;
          const pd: UserData = {
            user: prevUser,
            hasDiagnostic: attempts.length > 0,
            attempts,
            daily,
            gamification,
            seeded: false,
          };
          const profiles = { ...s.profiles, [email]: pd };
          // if this is the active user, refresh the live session too
          if (s.currentEmail === email) {
            return { profiles, attempts, daily, gamification, hasDiagnostic: pd.hasDiagnostic };
          }
          return { profiles };
        });
      },

      // Admin: pull every student's history into the profiles map.
      hydrateStudents: async () => {
        if (!isRemoteEnabled) return;
        const byUser = await fetchAttemptsForUsers(STUDENT_EMAILS);
        set((s) => {
          const profiles = { ...s.profiles };
          for (const email of STUDENT_EMAILS) {
            const remote = byUser[email] ?? [];
            if (!remote.length) continue;
            const attempts = mergeAttempts([], remote);
            const { daily, gamification } = rebuildFromAttempts(attempts);
            profiles[email] = {
              user: profiles[email]?.user ?? {
                name: '', email, role: 'student', targetScore: 1450, studyHoursPerDay: 1, createdAt: Date.now(),
              },
              hasDiagnostic: true,
              attempts,
              daily,
              gamification,
              seeded: false,
            };
          }
          return { profiles };
        });
      },
    }),
    {
      name: 't1450-store',
      version: 2,
      // v1 stored a single flat profile; v2 partitions by email. Reset cleanly.
      migrate: (persisted: any, version) => {
        if (version < 2) {
          return {
            ...persisted,
            currentEmail: null,
            user: null,
            hasDiagnostic: false,
            attempts: [],
            gamification: initialGamification,
            daily: [],
            profiles: {},
          };
        }
        return persisted;
      },
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);
