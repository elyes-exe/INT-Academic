import { NextResponse } from 'next/server';
import { getAccountById, getAccounts, updateAccount } from '@/lib/server-accounts';
import { AccountRole, AccountStatus } from '@/lib/auth-types';
import { classSectionOptions, legacyClassOptions } from '@/lib/class-sections';
import { getAuthSessionAccountId } from '@/lib/server-auth-session';

function isRole(role: unknown): role is AccountRole {
  return role === 'admin' || role === 'staff' || role === 'prof' || role === 'student';
}

function isStatus(status: unknown): status is AccountStatus {
  return status === 'pending' || status === 'verified' || status === 'rejected';
}

export async function GET(request: Request) {
  const sessionId = await getAuthSessionAccountId(request);
  const sessionAccount = sessionId ? await getAccountById(sessionId) : null;
  if (!sessionAccount || sessionAccount.status !== 'verified' || sessionAccount.role !== 'admin') {
    return NextResponse.json({ message: 'Administrator access is required.' }, { status: 403 });
  }

  return NextResponse.json({ accounts: await getAccounts() });
}

export async function PATCH(request: Request) {
  try {
    const sessionId = await getAuthSessionAccountId(request);
    const sessionAccount = sessionId ? await getAccountById(sessionId) : null;
    if (!sessionAccount || sessionAccount.status !== 'verified' || sessionAccount.role !== 'admin') {
      return NextResponse.json({ message: 'Administrator access is required.' }, { status: 403 });
    }

    const body = await request.json();
    const accountId = typeof body.accountId === 'string' ? body.accountId : '';
    const changes: Partial<{ role: AccountRole; status: AccountStatus; className: string }> = {};

    if (isRole(body.role)) {
      changes.role = body.role;
    }

    if (isStatus(body.status)) {
      changes.status = body.status;
    }

    if (typeof body.className === 'string') {
      const className = body.className.trim();
      if (className && !classSectionOptions.includes(className) && !legacyClassOptions.includes(className)) {
        return NextResponse.json({ message: 'Choose a valid class.' }, { status: 400 });
      }
      changes.className = className;
    }

    if (!accountId || Object.keys(changes).length === 0) {
      return NextResponse.json({ message: 'Account id and changes are required.' }, { status: 400 });
    }

    const currentAccount = await getAccountById(accountId);

    if (!currentAccount) {
      return NextResponse.json({ message: 'Account not found.' }, { status: 404 });
    }

    const nextRole = changes.role ?? currentAccount.role;
    const nextStatus = changes.status ?? currentAccount.status;
    const nextClassName = changes.className === undefined ? currentAccount.className : changes.className;

    if (nextRole === 'student' && nextStatus === 'verified' && !nextClassName) {
      return NextResponse.json({ message: 'Assign a class to the student before verifying the account.' }, { status: 400 });
    }

    const account = await updateAccount(accountId, changes);

    if (!account) {
      return NextResponse.json({ message: 'Account not found.' }, { status: 404 });
    }

    return NextResponse.json({ account });
  } catch {
    return NextResponse.json({ message: 'Unable to update account.' }, { status: 500 });
  }
}
