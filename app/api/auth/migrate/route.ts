import { NextResponse } from 'next/server';
import { Account } from '@/lib/auth-types';
import { mergeAccounts } from '@/lib/server-accounts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accounts = Array.isArray(body.accounts) ? (body.accounts as Account[]) : [];

    return NextResponse.json({ accounts: await mergeAccounts(accounts) });
  } catch {
    return NextResponse.json({ message: 'Unable to migrate accounts.' }, { status: 500 });
  }
}
