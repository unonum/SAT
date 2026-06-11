/**
 * QA: Static question bank — section balance, format integrity, required fields.
 *
 * Catches regressions if a bad question is added to questionBank.ts.
 */
import { describe, it, expect } from 'vitest';
import { QUESTION_BANK } from '@/lib/questionBank';

const VALID_SECTIONS = ['Math', 'Reading & Writing'] as const;
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
const VALID_CHOICE_IDS = ['A', 'B', 'C', 'D'] as const;

describe('static question bank integrity', () => {
  it('has at least 80 questions (regression: was 73, now 94+)', () => {
    expect(QUESTION_BANK.length).toBeGreaterThanOrEqual(80);
  });

  it('has at least 40 R&W questions', () => {
    const count = QUESTION_BANK.filter(q => q.section === 'Reading & Writing').length;
    expect(count).toBeGreaterThanOrEqual(40);
  });

  it('has at least 40 Math questions', () => {
    const count = QUESTION_BANK.filter(q => q.section === 'Math').length;
    expect(count).toBeGreaterThanOrEqual(40);
  });

  it('every question has a unique id', () => {
    const ids = QUESTION_BANK.map(q => q.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every question has a valid section', () => {
    for (const q of QUESTION_BANK) {
      expect(VALID_SECTIONS).toContain(q.section);
    }
  });

  it('every question has a valid difficulty', () => {
    for (const q of QUESTION_BANK) {
      expect(VALID_DIFFICULTIES).toContain(q.difficulty);
    }
  });

  it('every question has exactly 4 choices A B C D', () => {
    for (const q of QUESTION_BANK) {
      expect(q.choices).toHaveLength(4);
      const ids = q.choices.map(c => c.id).sort();
      expect(ids).toEqual(['A', 'B', 'C', 'D']);
    }
  });

  it('every question\'s correct answer is one of its choice IDs', () => {
    for (const q of QUESTION_BANK) {
      expect(VALID_CHOICE_IDS).toContain(q.correct);
      const choiceIds = q.choices.map(c => c.id);
      expect(choiceIds).toContain(q.correct);
    }
  });

  it('every question has a non-empty prompt', () => {
    for (const q of QUESTION_BANK) {
      expect(q.prompt.trim().length).toBeGreaterThan(10);
    }
  });

  it('every question has an explanation object with required keys', () => {
    const required = ['correctWhy', 'fastStrategy', 'simplerView', 'trapNote', 'timeTrick', 'whyWrong'];
    for (const q of QUESTION_BANK) {
      const exp = q.explanation as Record<string, unknown>;
      for (const key of required) {
        expect(exp).toHaveProperty(key);
      }
    }
  });

  it('parTimeSec is a positive number for every question', () => {
    for (const q of QUESTION_BANK) {
      expect(q.parTimeSec).toBeGreaterThan(0);
    }
  });

  it('no two questions have the same content (passage + prompt duplicate detection)', () => {
    // SAT questions share generic prompts ("Which choice best completes the text?")
    // so uniqueness is measured by passage+prompt combined
    const q = QUESTION_BANK as Array<{ prompt: string; passage?: string }>;
    const keys = q.map(x => ((x.passage ?? '') + '|||' + x.prompt).trim().toLowerCase());
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('enough questions to fill Module 1 of both sections without RAG', () => {
    const rwCount   = QUESTION_BANK.filter(q => q.section === 'Reading & Writing').length;
    const mathCount = QUESTION_BANK.filter(q => q.section === 'Math').length;
    // Module 1 needs 27 R&W + 22 Math — static bank must always cover at least this
    expect(rwCount).toBeGreaterThanOrEqual(27);
    expect(mathCount).toBeGreaterThanOrEqual(22);
  });
});
