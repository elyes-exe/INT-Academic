import { NextResponse } from 'next/server';
import { updateAccountPassword } from '@/lib/server-accounts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    const account = await updateAccountPassword(email, password);

    if (!account) {
      return NextResponse.json({ message: 'Account not found.' }, { status: 404 });
    }

    return NextResponse.json({ account });
  } catch {
    return NextResponse.json({ message: 'Unable to reset password.' }, { status: 500 });
  }
}
