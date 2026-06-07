import type { Topic, TopicId } from './types';

export const TOPICS: Topic[] = [
  { id: 'algebra', name: 'Algebra', section: 'Math', description: 'Linear equations, systems, inequalities, and word problems.' },
  { id: 'advanced-math', name: 'Advanced Math', section: 'Math', description: 'Quadratics, exponentials, functions, and nonlinear equations.' },
  { id: 'problem-solving-data', name: 'Problem Solving & Data', section: 'Math', description: 'Ratios, percentages, statistics, and data interpretation.' },
  { id: 'geometry-trig', name: 'Geometry & Trig', section: 'Math', description: 'Angles, circles, triangles, area/volume, and trigonometry.' },
  { id: 'reading-comprehension', name: 'Reading Comprehension', section: 'Reading & Writing', description: 'Main idea, inference, evidence, and author purpose.' },
  { id: 'vocabulary-in-context', name: 'Vocabulary in Context', section: 'Reading & Writing', description: 'Words-in-context and precise word choice.' },
  { id: 'grammar', name: 'Grammar', section: 'Reading & Writing', description: 'Punctuation, agreement, and sentence structure.' },
  { id: 'rhetoric-expression', name: 'Rhetoric & Expression', section: 'Reading & Writing', description: 'Transitions, conciseness, and rhetorical synthesis.' },
];

export const TOPIC_MAP: Record<TopicId, Topic> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t])
) as Record<TopicId, Topic>;

export const MATH_TOPICS = TOPICS.filter((t) => t.section === 'Math').map((t) => t.id);
export const RW_TOPICS = TOPICS.filter((t) => t.section === 'Reading & Writing').map((t) => t.id);
