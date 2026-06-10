// ---------- Domain Types for Target1550 ----------

export type Section = 'Math' | 'Reading & Writing';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type TopicId =
  // Math
  | 'algebra'
  | 'advanced-math'
  | 'problem-solving-data'
  | 'geometry-trig'
  // Reading & Writing
  | 'reading-comprehension'
  | 'vocabulary-in-context'
  | 'grammar'
  | 'rhetoric-expression';

export interface Topic {
  id: TopicId;
  name: string;
  section: Section;
  description: string;
}

export interface Choice {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: string;
  topic: TopicId;
  subtopic: string;
  section: Section;
  difficulty: Difficulty;
  passage?: string;
  prompt: string;
  choices: Choice[];
  correct: 'A' | 'B' | 'C' | 'D';
  /** estimated seconds a well-prepared student needs */
  parTimeSec: number;
  ragGenerated?: boolean;
  sourceChunk?: string;
  /** AI tutor content authored per question */
  explanation: {
    correctWhy: string;
    fastStrategy: string;
    simplerView: string;
    trapNote: string;
    timeTrick: string;
    /** per-wrong-choice reason it's tempting/wrong */
    whyWrong: Partial<Record<'A' | 'B' | 'C' | 'D', string>>;
  };
}

export type MistakeCategory =
  | 'concept-gap'
  | 'misread'
  | 'calculation'
  | 'grammar-rule'
  | 'time-pressure'
  | 'guessing'
  | 'trap-answer';

export interface Attempt {
  id: string;
  questionId: string;
  topic: TopicId;
  difficulty: Difficulty;
  selected: 'A' | 'B' | 'C' | 'D' | null;
  correct: boolean;
  timeSec: number;
  confidence: 'low' | 'medium' | 'high';
  mistakeCategory?: MistakeCategory;
  retried?: boolean;
  ts: number; // timestamp
  mode: PracticeMode;
}

export type PracticeMode =
  | 'diagnostic'
  | 'daily-adaptive'
  | 'topic'
  | 'timed-drill'
  | 'weakness-repair'
  | 'mock'
  | 'speed'
  | 'error-review'
  | 'bootcamp'
  | 'revision-7day'
  | 'evaluation-1'
  | 'evaluation-2'
  | 'evaluation-3';

export interface TopicMastery {
  topic: TopicId;
  mastery: number; // 0-100
  accuracy: number;
  avgTimeSec: number;
  attempts: number;
  trend: number; // recent improvement delta
  status: 'repair' | 'developing' | 'proficient' | 'mastered';
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  questions: number;
  correct: number;
  timeSec: number;
  scoreEstimate: number;
}

export type Role = 'student' | 'parent' | 'admin';

/** Per-account data bundle (one per user, partitioned by email). */
export interface UserData {
  user: UserProfile | null;
  hasDiagnostic: boolean;
  attempts: Attempt[];
  gamification: Gamification;
  daily: DailyStat[];
  /** true when this is generated sample data, not real activity */
  seeded?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  role: Role;
  grade?: string;
  targetScore: number;
  testDate?: string;
  studyHoursPerDay: number;
  createdAt: number;
}

export interface Gamification {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  badges: string[];
}

export interface MockSettings {
  difficultyFilter: Partial<Record<TopicId, Difficulty[]>>;
  globalDifficulty: Difficulty[];
}
