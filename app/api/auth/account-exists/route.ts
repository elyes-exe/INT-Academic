import { NextResponse } from 'next/server';
import { findAccountByEmail } from '@/lib/server-accounts';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.trim() ?? '';
  if (!email) {
    return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
  }

  return NextResponse.json({ exists: Boolean(await findAccountByEmail(email)) });
}
