import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const cookieName = 'int_session';
const sessionLifetimeSeconds = 60 * 60 * 24 * 7;
const secretPath = path.join(process.cwd(), 'data', 'auth-session-secret');

async function getSessionSecret() {
  if (process.env.AUTH_SESSION_SECRET) {
    return process.env.AUTH_SESSION_SECRET;
  }

  await mkdir(path.dirname(secretPath), { recursive: true });

  try {
    return (await readFile(secretPath, 'utf8')).trim();
  } catch {
    const generatedSecret = randomBytes(48).toString('base64url');

    try {
      await writeFile(secretPath, generatedSecret, { encoding: 'utf8', flag: 'wx' });
      return generatedSecret;
    } catch {
      return (await readFile(secretPath, 'utf8')).trim();
    }
  }
}

async function sign(payload: string) {
  return createHmac('sha256', await getSessionSecret()).update(payload).digest('base64url');
}

export async function setAuthSession(response: NextResponse, accountId: string) {
  const payload = Buffer.from(JSON.stringify({
    accountId,
    expiresAt: Date.now() + sessionLifetimeSeconds * 1000,
  })).toString('base64url');
  const signature = await sign(payload);

  response.cookies.set(cookieName, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sessionLifetimeSeconds,
  });

  return response;
}

export async function clearAuthSession(response: NextResponse) {
  response.cookies.set(cookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return response;
}

export async function getAuthSessionAccountId(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const value = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);

  if (!value) return null;

  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;

  const expectedSignature = await sign(payload);
  const supplied = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      accountId?: unknown;
      expiresAt?: unknown;
    };

    if (typeof session.accountId !== 'string' || typeof session.expiresAt !== 'number' || session.expiresAt <= Date.now()) {
      return null;
    }

    return session.accountId;
  } catch {
    return null;
  }
}
