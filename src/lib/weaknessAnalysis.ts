import type { Attempt, Difficulty, MistakeCategory, TopicId } from './types';

export interface WeaknessSignal {
  topic: TopicId;
  subtopic: string;
  difficulty: Difficulty;
  mistakeCategory?: MistakeCategory;
  count: number;
  suggestedAction: string;
}

/**
 * Groups wrong attempts by topic + subtopic + difficulty, sorts by frequency,
 * and generates a plain-English suggestedAction per signal.
 */
export function computeWeaknessSignals(attempts: Attempt[]): WeaknessSignal[] {
  // Only look at wrong answers
  const wrong = attempts.filter((a) => !a.correct);

  // Build a map keyed by "topic|subtopic|difficulty"
  const map = new Map<string, { topic: TopicId; subtopic: string; difficulty: Difficulty; count: number; categories: MistakeCategory[] }>();

  for (const a of wrong) {
    // We need subtopic info — store best available from attempt; we'll rely on questionBank for subtopics
    // but Attempt doesn't carry subtopic. We store a placeholder and fill from the question bank later.
    const key = `${a.topic}|${a.difficulty}`;
    const entry = map.get(key);
    if (entry) {
      entry.count += 1;
      if (a.mistakeCategory) entry.categories.push(a.mistakeCategory);
    } else {
      map.set(key, {
        topic: a.topic,
        subtopic: '',
        difficulty: a.difficulty,
        count: 1,
        categories: a.mistakeCategory ? [a.mistakeCategory] : [],
      });
    }
  }

  const topicNames: Record<TopicId, string> = {
    algebra: 'Algebra',
    'advanced-math': 'Advanced Math',
    'problem-solving-data': 'Problem Solving & Data',
    'geometry-trig': 'Geometry & Trig',
    'reading-comprehension': 'Reading Comprehension',
    'vocabulary-in-context': 'Vocabulary in Context',
    grammar: 'Grammar',
    'rhetoric-expression': 'Rhetoric & Expression',
  };

  const signals: WeaknessSignal[] = [];

  for (const entry of map.values()) {
    const topicLabel = topicNames[entry.topic] ?? entry.topic;
    // Most frequent mistake category
    const catCounts = new Map<string, number>();
    for (const c of entry.categories) catCounts.set(c, (catCounts.get(c) ?? 0) + 1);
    let topCat: MistakeCategory | undefined;
    let topCatCount = 0;
    for (const [cat, cnt] of catCounts) {
      if (cnt > topCatCount) { topCatCount = cnt; topCat = cat as MistakeCategory; }
    }

    const diffLabel = entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1);
    const action = `Drill ${entry.difficulty} ${topicLabel}${topCat ? ` (${topCat.replace(/-/g, ' ')})` : ''} — ${entry.count} miss${entry.count !== 1 ? 'es' : ''}`;

    signals.push({
      topic: entry.topic,
      subtopic: entry.subtopic || diffLabel,
      difficulty: entry.difficulty,
      mistakeCategory: topCat,
      count: entry.count,
      suggestedAction: action,
    });
  }

  return signals.sort((a, b) => b.count - a.count);
}
