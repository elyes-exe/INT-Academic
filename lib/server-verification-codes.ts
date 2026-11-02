import { randomInt, randomUUID } from 'crypto';

export type VerificationPurpose = 'signup' | 'password-reset';

type VerificationRecord = {
  email: string;
  code: string;
  purpose: VerificationPurpose;
  expiresAt: number;
};

const codeLifetimeMs = 15 * 60 * 1000;

const globalForCodes = globalThis as typeof globalThis & {
  __intVerificationCodes?: Map<string, VerificationRecord>;
};

const verificationCodes = globalForCodes.__intVerificationCodes ?? new Map<string, VerificationRecord>();
globalForCodes.__intVerificationCodes = verificationCodes;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function cleanupExpiredCodes() {
  const now = Date.now();

  for (const [id, record] of verificationCodes.entries()) {
    if (record.expiresAt <= now) {
      verificationCodes.delete(id);
    }
  }
}

export function createVerificationCode(email: string, purpose: VerificationPurpose) {
  cleanupExpiredCodes();

  const verificationId = randomUUID();
  const code = String(randomInt(100000, 1000000));

  verificationCodes.set(verificationId, {
    email: normalizeEmail(email),
    code,
    purpose,
    expiresAt: Date.now() + codeLifetimeMs,
  });

  return { verificationId, code, expiresAt: Date.now() + codeLifetimeMs };
}

export function verifyEmailCode(input: {
  verificationId: string;
  email: string;
  code: string;
  purpose: VerificationPurpose;
}) {
  cleanupExpiredCodes();

  const record = verificationCodes.get(input.verificationId);

  if (!record) {
    return { success: false, message: 'The verification code expired. Please request a new one.' };
  }

  const matches =
    record.email === normalizeEmail(input.email) &&
    record.code === input.code.trim() &&
    record.purpose === input.purpose;

  if (!matches) {
    return { success: false, message: 'Invalid verification code.' };
  }

  verificationCodes.delete(input.verificationId);
  return { success: true };
}
