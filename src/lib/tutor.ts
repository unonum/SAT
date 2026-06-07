import type { Attempt, Question, TopicMastery, MistakeCategory } from './types';
import { TOPIC_MAP } from './topics';

// AI SAT Tutor logic. In production this layer calls an LLM with the question,
// the student's answer, and their mastery profile to generate the coaching copy.
// Here we compose an encouraging, structured explanation deterministically so
// the experience works fully offline — with the same shape an LLM would return.

export const MISTAKE_LABELS: Record<MistakeCategory, string> = {
  'concept-gap': 'Concept gap',
  misread: 'Misread the question',
  calculation: 'Calculation error',
  'grammar-rule': 'Grammar rule missed',
  'time-pressure': 'Time pressure',
  guessing: 'Guessing',
  'trap-answer': 'Trap answer selected',
};

const ENCOURAGERS = [
  "Nice effort — let's turn this into a win.",
  "You're closer than you think on this one.",
  "Great chance to lock in an easy point next time.",
  "This is exactly the kind of question we'll make automatic.",
];

export interface TutorExplanation {
  headline: string;
  whySelectedWrong: string;
  whyCorrect: string;
  fastStrategy: string;
  simplerView: string;
  trapNote: string;
  timeTrick: string;
  improvementTip: string;
}

export function explainQuestion(
  q: Question,
  selected: string | null,
  mastery?: TopicMastery
): TutorExplanation {
  const topicName = TOPIC_MAP[q.topic].name;
  const enc = ENCOURAGERS[Math.floor(Math.random() * ENCOURAGERS.length)];

  const whySelectedWrong =
    selected && selected !== q.correct && q.explanation.whyWrong[selected as 'A']
      ? q.explanation.whyWrong[selected as 'A']!
      : selected === null
      ? "You skipped this one — no penalty for trying! Let's break down how to attack it."
      : 'Your choice missed the key relationship. Here is the cleaner path.';

  let improvementTip: string;
  if (mastery && mastery.mastery < 50) {
    improvementTip = `${topicName} is in concept-repair mode (mastery ${mastery.mastery}%). We'll start you with easier ${q.subtopic.toLowerCase()} questions and build up.`;
  } else if (mastery && mastery.avgTimeSec > q.parTimeSec * 1.4) {
    improvementTip = `You're getting these right but spending ~${mastery.avgTimeSec}s vs a ${q.parTimeSec}s target. Tomorrow's timed drill will sharpen your speed here.`;
  } else {
    improvementTip = `You're trending well in ${topicName}. A few more ${q.difficulty} questions and this becomes a strength.`;
  }

  return {
    headline: enc,
    whySelectedWrong,
    whyCorrect: q.explanation.correctWhy,
    fastStrategy: q.explanation.fastStrategy,
    simplerView: q.explanation.simplerView,
    trapNote: q.explanation.trapNote,
    timeTrick: q.explanation.timeTrick,
    improvementTip,
  };
}

/** Daily motivational + analytical feedback message. */
export function generateDailyFeedback(
  todayAttempts: Attempt[],
  mastery: TopicMastery[],
  streak: number
): { message: string; nextStep: string } {
  const total = todayAttempts.length;
  if (total === 0) {
    return {
      message: "You haven't practiced yet today. Even 10 questions keeps your streak alive and your skills sharp!",
      nextStep: 'Start a 10-question daily adaptive session.',
    };
  }
  const correct = todayAttempts.filter((a) => a.correct).length;
  const acc = Math.round((correct / total) * 100);

  const weakest = [...mastery].filter((m) => m.attempts > 0).sort((a, b) => a.mastery - b.mastery)[0];
  const improving = [...mastery].filter((m) => m.trend > 5).sort((a, b) => b.trend - a.trend)[0];

  let message = `You completed ${total} questions today at ${acc}% accuracy`;
  if (streak > 1) message += `, keeping a ${streak}-day streak alive 🔥`;
  message += '. ';
  if (improving) {
    message += `Big progress in ${TOPIC_MAP[improving.topic].name} (trending +${improving.trend}%). `;
  }
  if (weakest && weakest.mastery < 70) {
    message += `${TOPIC_MAP[weakest.topic].name} is still your softest spot (${weakest.mastery}% mastery).`;
  } else {
    message += 'Your weak areas are firming up nicely.';
  }

  const nextStep = weakest
    ? `Tomorrow's session will focus on ${TOPIC_MAP[weakest.topic].name} to close the gap fastest.`
    : 'Tomorrow: a mixed adaptive set to keep every skill sharp.';

  return { message, nextStep };
}

/** Weekly AI report. */
export function generateWeeklyReport(
  attempts: Attempt[],
  mastery: TopicMastery[],
  scoreNow: number,
  scoreLastWeek: number
) {
  const sorted = [...mastery].filter((m) => m.attempts > 0).sort((a, b) => b.mastery - a.mastery);
  const strongest = sorted.slice(0, 2).map((m) => TOPIC_MAP[m.topic].name);
  const weakest = sorted.slice(-2).reverse().map((m) => TOPIC_MAP[m.topic].name);

  const mistakeCounts: Record<string, number> = {};
  attempts.filter((a) => !a.correct && a.mistakeCategory).forEach((a) => {
    mistakeCounts[a.mistakeCategory!] = (mistakeCounts[a.mistakeCategory!] || 0) + 1;
  });
  const topMistake = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0];

  const delta = scoreNow - scoreLastWeek;
  const confidence = mastery.filter((m) => m.attempts > 0).length >= 6 ? 'High' : 'Moderate';

  return {
    scoreNow,
    delta,
    strongest,
    weakest,
    topMistake: topMistake ? MISTAKE_LABELS[topMistake[0] as MistakeCategory] : 'None yet',
    focusNextWeek: weakest[0] ?? 'Maintain breadth',
    confidence,
    riskAreas: sorted.filter((m) => m.mastery < 50).map((m) => TOPIC_MAP[m.topic].name),
    parentAction:
      weakest.length > 0
        ? `Encourage focused practice on ${weakest[0]} and review the error log together.`
        : 'Celebrate consistent effort and keep the streak going.',
  };
}
