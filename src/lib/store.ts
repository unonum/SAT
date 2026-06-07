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
import { seedStudentProfiles } from './seed';

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

/** Ensure the two student profiles exist with sample data (admin view). */
function ensureSeededStudents(profiles: Record<string, UserData>): Record<string, UserData> {
  const needsSeed = STUDENT_EMAILS.some(
    (e) => !profiles[e] || profiles[e].attempts.length === 0
  );
  if (!needsSeed) return profiles;
  const seeds = seedStudentProfiles();
  const merged = { ...profiles };
  for (const e of STUDENT_EMAILS) {
    if (!merged[e] || merged[e].attempts.length === 0) merged[e] = seeds[e];
  }
  return merged;
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

          // admins get the student sample data populated for the master dashboard
          if (admin) profiles = ensureSeededStudents(profiles);

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

      retryAttempt: (attemptId) =>
        set((s) => {
          const attempts = s.attempts.map((a) => (a.id === attemptId ? { ...a, retried: true } : a));
          return { attempts, profiles: snapshotProfiles({ ...s, attempts }) };
        }),

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
