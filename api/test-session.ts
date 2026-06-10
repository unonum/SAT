import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  cosineSimilarity,
  ensureRagSchema,
  fetchAllChunks,
  fetchRagQuestions,
  getClient,
  upsertRagQuestion,
  type RagQuestionRow,
} from './_lib/turso.js';

export const config = { maxDuration: 60, api: { bodyParser: { sizeLimit: '4mb' } } };

type Difficulty = 'easy' | 'medium' | 'hard';
type Section = 'Math' | 'Reading & Writing';
type ChoiceId = 'A' | 'B' | 'C' | 'D';
type Choice = { id: ChoiceId; text: string };
type MistakeCategory = 'concept-gap' | 'calculation' | 'time-pressure' | 'misread' | 'guessing';
type ClientQuestion = {
  id: string;
  topic: string;
  subtopic: string;
  section: Section;
  difficulty: Difficulty;
  passage?: string;
  prompt: string;
  choices: Choice[];
  correct: ChoiceId;
  parTimeSec: number;
  explanation: Record<string, unknown>;
  ragGenerated?: boolean;
  sourceChunk?: string;
};
type AttemptSummary = {
  questionId: string;
  topic: string;
  difficulty: Difficulty;
  correct: boolean;
  ts: number;
  timeSec?: number;
  confidence?: 'low' | 'medium' | 'high';
  mistakeCategory?: MistakeCategory | null;
  retried?: boolean;
};
type Slot = {
  topic: string;
  section: Section;
  difficulty: Difficulty;
  repairMode: boolean;
  focusMistake: MistakeCategory | null;
};
type TopicProfile = {
  topic: string;
  section: Section;
  attempts: number;
  accuracy: number;
  mastery: number;
  avgTimeSec: number;
  trend: number;
  topMistake: MistakeCategory | null;
  mistakeCounts: Record<MistakeCategory, number>;
  lowConfidenceRate: number;
  retriedRate: number;
  status: 'repair' | 'developing' | 'proficient' | 'mastered';
  targetDifficulty: Difficulty;
};

const TOPICS: Array<{ id: string; section: Section }> = [
  { id: 'algebra', section: 'Math' },
  { id: 'advanced-math', section: 'Math' },
  { id: 'problem-solving-data', section: 'Math' },
  { id: 'geometry-trig', section: 'Math' },
  { id: 'reading-comprehension', section: 'Reading & Writing' },
  { id: 'vocabulary-in-context', section: 'Reading & Writing' },
  { id: 'grammar', section: 'Reading & Writing' },
  { id: 'rhetoric-expression', section: 'Reading & Writing' },
];
const VALID_DIFFICULTIES = new Set<Difficulty>(['easy', 'medium', 'hard']);
const VALID_SECTIONS = new Set<Section>(['Math', 'Reading & Writing']);

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function lexicalOverlap(a: string, b: string): number {
  const wa = new Set(normalize(a).split(/\s+/).filter((w) => w.length > 2));
  const wb = new Set(normalize(b).split(/\s+/).filter((w) => w.length > 2));
  if (!wa.size || !wb.size) return 0;
  let n = 0;
  for (const w of wa) if (wb.has(w)) n++;
  return n / Math.max(wa.size, wb.size);
}

function isNovel(prompt: string, existing: string[]): boolean {
  return !existing.some((e) => lexicalOverlap(e, prompt) >= 0.68);
}

function buildTopicProfiles(attempts: AttemptSummary[]): TopicProfile[] {
  return TOPICS.map(({ id: topic, section }) => {
    const topicAttempts = attempts.filter((a) => a.topic === topic);
    if (!topicAttempts.length) {
      return {
        topic, section, attempts: 0, accuracy: 0, mastery: 0, avgTimeSec: 0,
        trend: 0, topMistake: null, mistakeCounts: {} as Record<MistakeCategory, number>,
        lowConfidenceRate: 0, retriedRate: 0, status: 'developing', targetDifficulty: 'easy',
      };
    }

    const sorted = [...topicAttempts].sort((a, b) => a.ts - b.ts);
    const recent8 = sorted.slice(-8);
    const accuracy = Math.round((topicAttempts.filter((a) => a.correct).length / topicAttempts.length) * 100);

    // Difficulty weight: easy=1, medium=1.5, hard=2
    const diffWeight: Record<Difficulty, number> = { easy: 1, medium: 1.5, hard: 2 };
    let wCorrect = 0, wTotal = 0;
    for (const a of topicAttempts) {
      const w = diffWeight[a.difficulty] ?? 1;
      wTotal += w;
      if (a.correct) wCorrect += w;
    }
    const weightedAccuracy = wTotal ? wCorrect / wTotal : 0;

    // Trend: recent 4 vs prior 4
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
    const acc1 = firstHalf.length ? firstHalf.filter((a) => a.correct).length / firstHalf.length : 0;
    const acc2 = secondHalf.length ? secondHalf.filter((a) => a.correct).length / secondHalf.length : 0;
    const trend = Math.round((acc2 - acc1) * 100);

    // Confidence signals
    const lowConf = topicAttempts.filter((a) => a.confidence === 'low').length / topicAttempts.length;
    const retried = topicAttempts.filter((a) => a.retried).length / topicAttempts.length;

    // Mastery: weighted formula
    const recentAcc = recent8.filter((a) => a.correct).length / recent8.length;
    const trendBonus = trend > 0 ? 0.05 : trend < 0 ? -0.05 : 0;
    const confPenalty = lowConf > 0.4 ? -0.08 : 0;
    const mastery = Math.round(
      Math.min(100, Math.max(0,
        (weightedAccuracy * 0.45 + recentAcc * 0.25 + (trendBonus + 0.15) * 0.15 + (1 - confPenalty) * 0.15) * 100
      ))
    );

    // Mistake analysis
    const mistakeCounts = {} as Record<MistakeCategory, number>;
    for (const a of topicAttempts.filter((a) => !a.correct && a.mistakeCategory)) {
      const k = a.mistakeCategory as MistakeCategory;
      mistakeCounts[k] = (mistakeCounts[k] ?? 0) + 1;
    }
    let topMistake: MistakeCategory | null = null;
    let topCount = 0;
    for (const [k, v] of Object.entries(mistakeCounts)) {
      if (v > topCount) { topCount = v; topMistake = k as MistakeCategory; }
    }

    const avgTimeSec = topicAttempts.filter((a) => a.timeSec).reduce((s, a) => s + (a.timeSec ?? 0), 0) /
      (topicAttempts.filter((a) => a.timeSec).length || 1);

    const status: TopicProfile['status'] = mastery < 50 ? 'repair' : mastery < 70 ? 'developing' : mastery < 88 ? 'proficient' : 'mastered';

    // Target difficulty: push up if proficient+, repair to easy unless concept gap
    let targetDifficulty: Difficulty = 'medium';
    if (status === 'repair') {
      targetDifficulty = topMistake === 'time-pressure' ? 'medium' : 'easy';
    } else if (status === 'developing') {
      targetDifficulty = 'medium';
    } else if (status === 'proficient') {
      targetDifficulty = 'hard';
    } else {
      targetDifficulty = 'hard';
    }

    return {
      topic, section, attempts: topicAttempts.length, accuracy, mastery, avgTimeSec,
      trend, topMistake, mistakeCounts, lowConfidenceRate: lowConf, retriedRate: retried,
      status, targetDifficulty,
    };
  });
}

function buildStudentContext(profiles: TopicProfile[], mode: string): string {
  const lines: string[] = ['=== STUDENT PERFORMANCE PROFILE ==='];

  for (const p of profiles) {
    if (!p.attempts) continue;
    const flag = p.status === 'repair' ? '🔴 REPAIR' : p.status === 'developing' ? '🟡 DEVELOPING' : p.status === 'proficient' ? '🟢 PROFICIENT' : '⭐ MASTERED';
    const trend = p.trend > 0 ? `↑${p.trend}%` : p.trend < 0 ? `↓${Math.abs(p.trend)}%` : '→';
    lines.push(`\n[${p.topic}] ${flag} | mastery:${p.mastery}% acc:${p.accuracy}% trend:${trend} n=${p.attempts}`);
    if (p.topMistake) lines.push(`  top mistake: ${p.topMistake} (${p.mistakeCounts[p.topMistake]}x)`);
    if (p.lowConfidenceRate > 0.3) lines.push(`  ⚠ low-confidence rate: ${Math.round(p.lowConfidenceRate * 100)}%`);
    if (p.avgTimeSec > 0) {
      const pace = p.avgTimeSec > 90 ? '⏰ SLOW' : p.avgTimeSec < 40 ? '⚡ FAST' : '✓ OK';
      lines.push(`  avg time: ${Math.round(p.avgTimeSec)}s ${pace}`);
    }
    if (p.trend < -10) lines.push(`  ⚠ DECLINING — needs reinforcement`);
  }

  const repairTopics = profiles.filter((p) => p.status === 'repair' && p.attempts > 0);
  if (repairTopics.length) {
    lines.push(`\n=== REPAIR PRIORITY (mastery < 50%) ===`);
    for (const p of repairTopics) {
      lines.push(`- ${p.topic}: mastery ${p.mastery}% — generate EASIER questions targeting ${p.topMistake ?? 'accuracy'}`);
    }
  }

  lines.push(`\n=== GENERATION DIRECTIVES (mode: ${mode}) ===`);
  if (mode === 'weakness-repair') {
    lines.push('- Focus EXCLUSIVELY on repair and developing topics');
    lines.push('- Prefer easy/medium difficulty — rebuild fundamentals before advancing');
    lines.push('- For concept-gap mistakes: generate definition/rule-application questions');
    lines.push('- For calculation mistakes: generate step-by-step computation questions');
    lines.push('- For time-pressure mistakes: generate streamlined questions with fast shortcuts');
  } else if (mode === 'mock') {
    lines.push('- Mix all topics proportional to SAT section weighting');
    lines.push('- Include all difficulties — replicate real exam pressure');
    lines.push('- Avoid dwelling on mastered topics — challenge with novel scenarios');
  } else if (mode === 'speed') {
    lines.push('- Focus on time-efficiency — questions must be solvable in < 60s');
    lines.push('- Reward pattern recognition over computation');
  } else {
    lines.push('- Adaptive practice: weight weak topics more heavily');
    lines.push('- Incrementally increase difficulty as mastery improves');
    lines.push('- If retried > 30%: generate conceptually simpler variants first');
  }

  lines.push('\n=== PER-MISTAKE GENERATION RULES ===');
  lines.push('concept-gap: start with the core rule/definition; make correct answer hinge on knowing it');
  lines.push('calculation: include multi-step arithmetic; trap answer = common arithmetic error');
  lines.push('time-pressure: design for 45-60s solve time; hint at efficient strategy in explanation');
  lines.push('misread: vary question phrasing (NOT/EXCEPT/BEST); require careful reading of stem');
  lines.push('guessing: include plausible distractors; explanation must reveal WHY each wrong choice is tempting');

  return lines.join('\n');
}

function buildSlots(count: number, requestedTopics: string[], profiles: TopicProfile[], mode: string): Slot[] {
  const allowed = requestedTopics.length
    ? profiles.filter((p) => requestedTopics.includes(p.topic))
    : profiles;
  const pool = allowed.length ? allowed : profiles;

  // Weight by status (repair topics appear 5x more often)
  const weights: Record<TopicProfile['status'], number> = { repair: 5, developing: 3, proficient: 2, mastered: 1 };
  const weighted: TopicProfile[] = [];
  for (const p of pool) {
    const w = weights[p.status] ?? 1;
    // Extra weight for declining topics
    const w2 = p.trend < -10 ? Math.ceil(w * 1.5) : w;
    for (let i = 0; i < w2; i++) weighted.push(p);
  }
  if (!weighted.length) return pool.slice(0, count).map((p) => ({
    topic: p.topic, section: p.section, difficulty: p.targetDifficulty, repairMode: false, focusMistake: null,
  }));

  const slots: Slot[] = [];
  for (let i = 0; i < count; i++) {
    const p = weighted[Math.floor(Math.random() * weighted.length)];
    let difficulty = p.targetDifficulty;
    // In weakness-repair mode: clamp repair topics to easy/medium
    if (mode === 'weakness-repair' && p.status === 'repair') {
      difficulty = p.topMistake === 'time-pressure' ? 'medium' : 'easy';
    }
    slots.push({
      topic: p.topic,
      section: p.section,
      difficulty,
      repairMode: p.status === 'repair',
      focusMistake: p.topMistake,
    });
  }
  return slots;
}

function parseQuestions(text: string): ClientQuestion[] {
  const s = text.indexOf('['), e = text.lastIndexOf(']');
  if (s < 0 || e <= s) return [];
  try { return JSON.parse(text.slice(s, e + 1)) as ClientQuestion[]; } catch { return []; }
}

function isValid(q: ClientQuestion | undefined): q is ClientQuestion {
  if (!q?.prompt || !q.subtopic || !VALID_SECTIONS.has(q.section) || !VALID_DIFFICULTIES.has(q.difficulty)) return false;
  if (!Array.isArray(q.choices) || q.choices.length !== 4) return false;
  const ids = q.choices.map((c) => c.id);
  return ids.join('') === 'ABCD' && ids.includes(q.correct) && q.choices.every((c) => Boolean(c.text?.trim()));
}

async function ensureNoveltySchema(): Promise<void> {
  const db = getClient();
  await db.execute(`CREATE TABLE IF NOT EXISTS question_exposures (
    user_email TEXT NOT NULL, question_id TEXT NOT NULL, mode TEXT NOT NULL,
    exposed_at INTEGER NOT NULL, PRIMARY KEY (user_email, question_id)
  )`);
}

async function loadSeenIds(email: string, attempts: AttemptSummary[]): Promise<Set<string>> {
  const ids = new Set(attempts.map((a) => a.questionId));
  if (!email) return ids;
  try {
    const db = getClient();
    const [att, exp] = await Promise.all([
      db.execute({ sql: 'SELECT DISTINCT question_id FROM attempts WHERE user_email = ?', args: [email.toLowerCase()] }),
      db.execute({ sql: 'SELECT question_id FROM question_exposures WHERE user_email = ?', args: [email.toLowerCase()] }),
    ]);
    for (const r of [...att.rows, ...exp.rows]) ids.add(String(r.question_id));
  } catch { /* best-effort */ }
  return ids;
}

async function saveExposures(email: string, mode: string, questions: ClientQuestion[]): Promise<void> {
  if (!email || !questions.length) return;
  const now = Date.now();
  try {
    await getClient().batch(questions.map((q) => ({
      sql: `INSERT OR IGNORE INTO question_exposures (user_email, question_id, mode, exposed_at) VALUES (?, ?, ?, ?)`,
      args: [email.toLowerCase(), q.id, mode, now],
    })), 'write');
  } catch { /* best-effort */ }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await ensureRagSchema();
    await ensureNoveltySchema();

    const {
      email = '', mode = 'practice', count = 8, topics = [],
      attempts = [], avoidPrompts = [], fallbackQuestions = [],
    } = req.body ?? {};

    const requestedCount = Math.max(1, Math.min(20, Number(count) || 8));
    const attemptSummaries = (Array.isArray(attempts) ? attempts : []) as AttemptSummary[];

    // ── Build rich per-topic profiles from full attempt history ──────────
    const profiles = buildTopicProfiles(attemptSummaries);
    const studentContext = buildStudentContext(profiles, String(mode));
    const slots = buildSlots(requestedCount, Array.isArray(topics) ? topics : [], profiles, String(mode));
    const seenIds = await loadSeenIds(String(email), attemptSummaries);

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // ── 1. Fetch stored RAG questions unseen by this student ──────────────
    const [storedRows, chunks] = await Promise.all([fetchRagQuestions(), fetchAllChunks()]);
    const unseenStored = storedRows.filter((r) => !seenIds.has(r.id));

    // ── 2. Embed query for RAG context retrieval ──────────────────────────
    const queryText = `SAT ${slots.map((s) => `${s.section} ${s.topic} ${s.difficulty}`).join(', ')} questions`;
    let contextText = `General SAT content for these topics.`;
    let topChunkId: string | null = null;

    if (chunks.length > 0) {
      const embResp = await openai.embeddings.create({ model: 'text-embedding-3-small', input: [queryText] });
      const qv = embResp.data[0].embedding;
      const scored = chunks.map((c) => ({ ...c, score: cosineSimilarity(qv, c.embedding) }))
        .sort((a, b) => b.score - a.score);
      const top8 = scored.slice(0, 8);
      contextText = top8.map((c) => c.content).join('\n\n---\n\n');
      topChunkId = top8[0]?.id ?? null;
    }

    // ── 3. Build forbidden prompts list ───────────────────────────────────
    const clientAvoid = (Array.isArray(avoidPrompts) ? avoidPrompts : []).filter(Boolean).map(String);
    const storedPrompts = storedRows.map((r) => r.prompt);
    const forbiddenPrompts = [...new Set([...clientAvoid, ...storedPrompts])];

    // ── 4. Build adaptive prompt with full student intelligence ───────────
    const now = Date.now();
    const slotDescriptions = slots.map((s, i) => ({
      index: i,
      topic: s.topic,
      section: s.section,
      difficulty: s.difficulty,
      repairMode: s.repairMode,
      focusMistake: s.focusMistake,
    }));

    const prompt = `You are an expert SAT item writer designing a personalized study session.

${studentContext}

=== YOUR TASK ===
Generate exactly ${slots.length} brand-new SAT questions — one per slot. Each slot specifies the topic, difficulty, and (when repairMode=true) the specific mistake type to target. Personalize every question to address THAT student's documented weakness.

SLOTS:
${JSON.stringify(slotDescriptions, null, 2)}

CONTEXT MATERIAL (inspire questions — do NOT copy verbatim):
${contextText.slice(0, 5000)}

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array — no markdown fences, no explanation outside the array.
- Each object must have: topic, subtopic, section, difficulty, passage (string|null), prompt, choices (exactly [{id:"A",...},{id:"B",...},{id:"C",...},{id:"D",...}]), correct, parTimeSec, explanation.
- explanation must have: correctWhy (why correct answer is right), fastStrategy (concrete test-day shortcut, e.g. "plug in x=2"), simplerView (ELI5 restatement), trapNote (what makes students pick wrong answer), timeTrick (how to solve in under 60s), whyWrong (object mapping each distractor id to WHY it's tempting, not just "it's wrong").
- For repairMode=true slots: the question must directly test the focusMistake concept — make it impossible to guess correctly without understanding the underlying rule.
- Incrementally harder within each topic's current ability range — not randomly hard.

FORBIDDEN PROMPTS (do not reuse or paraphrase):
${forbiddenPrompts.slice(-60).map((p, i) => `${i + 1}. ${p.slice(0, 120)}`).join('\n')}`;

    // ── 5. Call OpenAI and Anthropic in parallel ──────────────────────────
    const [oaiResult, anthropicResult] = await Promise.allSettled([
      openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
      }).then((r) => parseQuestions(r.choices[0]?.message?.content ?? '')),

      (async () => {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const r = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        });
        const text = r.content[0]?.type === 'text' ? r.content[0].text : '';
        return parseQuestions(text);
      })(),
    ]);

    const allGenerated: ClientQuestion[] = [];
    if (oaiResult.status === 'fulfilled') allGenerated.push(...oaiResult.value);
    if (anthropicResult.status === 'fulfilled') allGenerated.push(...anthropicResult.value);

    // ── 6. Deduplicate and validate ────────────────────────────────────────
    const acceptedPrompts: string[] = [...forbiddenPrompts];
    const finalQuestions: ClientQuestion[] = [];

    for (const q of allGenerated) {
      if (finalQuestions.length >= requestedCount) break;
      if (!isValid(q)) continue;
      if (!isNovel(q.prompt, acceptedPrompts)) continue;
      const slot = slots[finalQuestions.length] ?? slots[slots.length - 1];
      const id = `rag-${slot.topic}-${now}-${finalQuestions.length}-${Math.random().toString(36).slice(2, 7)}`;
      const question: ClientQuestion = {
        ...q,
        id,
        topic: slot.topic,
        section: slot.section,
        difficulty: slot.difficulty,
        ragGenerated: true,
        sourceChunk: topChunkId ?? undefined,
      };
      finalQuestions.push(question);
      acceptedPrompts.push(q.prompt);
    }

    // ── 7. Save generated questions to DB ─────────────────────────────────
    for (const q of finalQuestions) {
      const row: RagQuestionRow = {
        id: q.id,
        topic: q.topic,
        subtopic: q.subtopic,
        section: q.section,
        difficulty: q.difficulty,
        passage: q.passage ?? null,
        prompt: q.prompt,
        choices: JSON.stringify(q.choices),
        correct: q.correct,
        par_time_sec: Number(q.parTimeSec) || 60,
        explanation: JSON.stringify(q.explanation ?? {}),
        source_chunk: q.sourceChunk ?? null,
        created_at: now,
      };
      await upsertRagQuestion(row);
    }

    // ── 8. Fill remaining slots from unseen stored questions ──────────────
    const acceptedIds = new Set(finalQuestions.map((q) => q.id));
    const acceptedFinalPrompts = finalQuestions.map((q) => q.prompt);

    for (const row of unseenStored) {
      if (finalQuestions.length >= requestedCount) break;
      if (acceptedIds.has(row.id)) continue;
      if (!isNovel(row.prompt, [...forbiddenPrompts, ...acceptedFinalPrompts])) continue;
      let choices: Choice[] = [];
      try { choices = JSON.parse(row.choices) as Choice[]; } catch { continue; }
      finalQuestions.push({
        id: row.id,
        topic: row.topic,
        subtopic: row.subtopic,
        section: row.section as Section,
        difficulty: row.difficulty as Difficulty,
        passage: row.passage ?? undefined,
        prompt: row.prompt,
        choices,
        correct: row.correct as ChoiceId,
        parTimeSec: row.par_time_sec,
        explanation: typeof row.explanation === 'string'
          ? (JSON.parse(row.explanation) as Record<string, unknown>)
          : (row.explanation as Record<string, unknown>),
        ragGenerated: true,
        sourceChunk: row.source_chunk ?? undefined,
      });
      acceptedFinalPrompts.push(row.prompt);
    }

    // ── 9. Fallback to client-supplied static questions ───────────────────
    if (finalQuestions.length < requestedCount) {
      const fallbackSeenIds = new Set(finalQuestions.map((q) => q.id));
      const fallback = (Array.isArray(fallbackQuestions) ? fallbackQuestions : []) as ClientQuestion[];
      for (const q of fallback) {
        if (finalQuestions.length >= requestedCount) break;
        if (seenIds.has(q.id) || fallbackSeenIds.has(q.id)) continue;
        if (!isNovel(q.prompt, acceptedFinalPrompts)) continue;
        finalQuestions.push(q);
        acceptedFinalPrompts.push(q.prompt);
      }
    }

    if (!finalQuestions.length) {
      return res.status(503).json({ error: 'No novel questions available — please try again' });
    }

    await saveExposures(String(email), String(mode), finalQuestions);

    return res.status(200).json({
      sessionId: `session-${now}-${Math.random().toString(36).slice(2, 8)}`,
      mode,
      questions: finalQuestions.slice(0, requestedCount),
      source: finalQuestions.some((q) => q.ragGenerated) ? 'rag-llm' : 'static-fallback',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[api/test-session]', error);
    return res.status(500).json({ error: message });
  }
}
