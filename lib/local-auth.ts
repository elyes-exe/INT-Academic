'use client';

import { Account, AccountRole, AccountStatus } from '@/lib/auth-types';

export type { Account, AccountRole, AccountStatus };

type SignInResult =
  | { success: true; account: Account }
  | { success: false; message: string };

type CreateAccountResult =
  | { success: true; account: Account }
  | { success: false; message: string };

const ACCOUNTS_KEY = 'intAccounts';
const SESSION_KEY = 'intCurrentUser';
const MIGRATION_KEY = 'intAccountsMigratedToMysql';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

async function migrateLegacyAccounts() {
  if (!canUseStorage() || window.localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  const rawAccounts = window.localStorage.getItem(ACCOUNTS_KEY);

  if (!rawAccounts) {
    window.localStorage.setItem(MIGRATION_KEY, 'true');
    return;
  }

  try {
    const accounts = JSON.parse(rawAccounts);
    await requestJson<{ accounts: Account[] }>('/api/auth/migrate', {
      method: 'POST',
      body: JSON.stringify({ accounts }),
    });
    window.localStorage.setItem(MIGRATION_KEY, 'true');
  } catch {
    // Keep the marker unset so the app can retry migration on the next auth request.
  }
}

export async function getAccounts() {
  await migrateLegacyAccounts();
  const data = await requestJson<{ accounts: Account[] }>('/api/auth/accounts');
  return data.accounts;
}

export async function findAccountByEmail(email: string) {
  const accounts = await getAccounts();
  return accounts.find((account) => account.email.toLowerCase() === email.trim().toLowerCase()) ?? null;
}

export async function createStudentAccount(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<CreateAccountResult> {
  await migrateLegacyAccounts();

  try {
    const data = await requestJson<{ account: Account }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    return { success: true, account: data.account };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unable to create account.',
    };
  }
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  await migrateLegacyAccounts();

  try {
    const data = await requestJson<{ account: Account }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setCurrentAccount(data.account);
    return { success: true, account: data.account };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Invalid email or password.',
    };
  }
}

export function setCurrentAccount(account: Account) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ accountId: account.id }));
  window.localStorage.setItem('userRole', account.role);
  window.localStorage.setItem('userEmail', account.email);
}

export async function getCurrentAccount() {
  if (!canUseStorage()) {
    return null;
  }

  await migrateLegacyAccounts();

  try {
    const rawSession = window.localStorage.getItem(SESSION_KEY);
    const session = rawSession ? JSON.parse(rawSession) : null;
    const accountId = typeof session?.accountId === 'string' ? session.accountId : '';

    if (!accountId) {
      return null;
    }

    const data = await requestJson<{ account: Account | null }>(
      `/api/auth/account?accountId=${encodeURIComponent(accountId)}`,
    );

    return data.account;
  } catch {
    return null;
  }
}

export async function updateAccount(
  accountId: string,
  changes: Partial<Pick<Account, 'role' | 'status'>>,
) {
  const data = await requestJson<{ account: Account }>('/api/auth/accounts', {
    method: 'PATCH',
    body: JSON.stringify({ accountId, ...changes }),
  });
  const currentAccount = await getCurrentAccount();

  if (currentAccount?.id === data.account.id) {
    setCurrentAccount(data.account);
  }

  return data.account;
}

export async function updateAccountProfile(
  accountId: string,
  changes: Partial<Pick<Account, 'fullName' | 'phone'>>,
) {
  const data = await requestJson<{ account: Account }>('/api/auth/account', {
    method: 'PATCH',
    body: JSON.stringify({ accountId, ...changes }),
  });
  const currentAccount = await getCurrentAccount();

  if (currentAccount?.id === data.account.id) {
    setCurrentAccount(data.account);
  }

  return data.account;
}

export async function updateAccountPassword(email: string, password: string) {
  const data = await requestJson<{ account: Account }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return data.account;
}

export async function signOut() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem('userRole');
  window.localStorage.removeItem('userEmail');

  try {
    const { createSupabaseClient } = await import('@/lib/supabase');
    await createSupabaseClient().auth.signOut();
  } catch {
    // Local account sign-out must still work if Supabase is not configured.
  }
}
