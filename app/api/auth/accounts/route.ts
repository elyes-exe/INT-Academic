import { NextResponse } from 'next/server';
import { getAccounts, updateAccount } from '@/lib/server-accounts';
import { AccountRole, AccountStatus } from '@/lib/auth-types';

function isRole(role: unknown): role is AccountRole {
  return role === 'admin' || role === 'staff' || role === 'prof' || role === 'student';
}

function isStatus(status: unknown): status is AccountStatus {
  return status === 'pending' || status === 'verified' || status === 'rejected';
}

export async function GET() {
  return NextResponse.json({ accounts: await getAccounts() });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const accountId = typeof body.accountId === 'string' ? body.accountId : '';
    const changes: Partial<{ role: AccountRole; status: AccountStatus }> = {};

    if (isRole(body.role)) {
      changes.role = body.role;
    }

    if (isStatus(body.status)) {
      changes.status = body.status;
    }

    if (!accountId || Object.keys(changes).length === 0) {
      return NextResponse.json({ message: 'Account id and changes are required.' }, { status: 400 });
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
