import { NextResponse } from 'next/server';
import { getAccountById, updateAccountProfile } from '@/lib/server-accounts';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId') ?? '';

  if (!accountId) {
    return NextResponse.json({ account: null }, { status: 200 });
  }

  return NextResponse.json({ account: await getAccountById(accountId) });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const accountId = typeof body.accountId === 'string' ? body.accountId : '';
    const fullName = typeof body.fullName === 'string' ? body.fullName : undefined;
    const phone = typeof body.phone === 'string' ? body.phone : undefined;

    if (!accountId) {
      return NextResponse.json({ message: 'Account id is required.' }, { status: 400 });
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
