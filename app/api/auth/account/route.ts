import { NextResponse } from 'next/server';
import { getAccountById, updateAccountProfile } from '@/lib/server-accounts';
import { getAuthSessionAccountId } from '@/lib/server-auth-session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId') ?? '';
  const sessionId = await getAuthSessionAccountId(request);

  if (!accountId || !sessionId || accountId !== sessionId) {
    return NextResponse.json({ account: null }, { status: 200 });
  }

  return NextResponse.json({ account: await getAccountById(accountId) });
}

export async function PATCH(request: Request) {
  try {
    const sessionId = await getAuthSessionAccountId(request);
    const body = await request.json();
    const accountId = typeof body.accountId === 'string' ? body.accountId : '';
    const fullName = typeof body.fullName === 'string' ? body.fullName : undefined;
    const phone = typeof body.phone === 'string' ? body.phone : undefined;

    if (!accountId || !sessionId || accountId !== sessionId) {
      return NextResponse.json({ message: 'You can only update your own account.' }, { status: 403 });
    }

    const currentAccount = await getAccountById(sessionId);
    if (!currentAccount || currentAccount.status !== 'verified') {
      return NextResponse.json({ message: 'A verified account is required.' }, { status: 403 });
    }

    const account = await updateAccountProfile(accountId, { fullName, phone });

    if (!account) {
      return NextResponse.json({ message: 'Account not found.' }, { status: 404 });
    }

    return NextResponse.json({ account });
  } catch {
    return NextResponse.json({ message: 'Unable to update account profile.' }, { status: 500 });
  }
}
