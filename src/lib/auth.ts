// Simple client-side access control for the demo.
// Only these accounts may log in, with a shared password.
// NOTE: this is front-end gating for a demo — not real security.

export const ADMIN_EMAIL = 'nameiznavin@gmail.com';

export const ALLOWED_USERS: Record<string, string> = {
  'nameiznavin@gmail.com': 'Navin',
  'nameistejasvi@gmail.com': 'Tejasvi',
  'nameisnagtej@gmail.com': 'Nagtej',
  'navin.kamuni@gmail.com': 'Navin Kamuni',
};

// The students the admin oversees.
export const STUDENT_EMAILS = [
  'nameistejasvi@gmail.com',
  'nameisnagtej@gmail.com',
  'navin.kamuni@gmail.com',
];

// Students that get demo sample data when the DB has no rows yet.
// (Real, live-only students are intentionally left out so the Master
//  Dashboard shows their genuine per-attempt activity, not synthetic data.)
export const SAMPLE_SEED_EMAILS = ['nameistejasvi@gmail.com', 'nameisnagtej@gmail.com'];

export const SHARED_PASSWORD = 'P@55word';

export function isAdmin(email?: string | null): boolean {
  return !!email && email.trim().toLowerCase() === ADMIN_EMAIL;
}

export function displayName(email: string): string {
  return ALLOWED_USERS[email.trim().toLowerCase()] ?? 'Student';
}

export interface AuthResult {
  ok: boolean;
  name?: string;
  isAdmin?: boolean;
  error?: string;
}

export function checkCredentials(email: string, password: string): AuthResult {
  const normalized = email.trim().toLowerCase();
  if (!(normalized in ALLOWED_USERS)) {
    return { ok: false, error: 'This email is not authorized for access.' };
  }
  if (password !== SHARED_PASSWORD) {
    return { ok: false, error: 'Incorrect password.' };
  }
  return { ok: true, name: ALLOWED_USERS[normalized], isAdmin: isAdmin(normalized) };
}
