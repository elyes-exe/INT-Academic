import { NextResponse } from 'next/server';
import { signIn } from '@/lib/server-accounts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    const result = await signIn(email, password);

    if (!result.success) {
      return NextResponse.json({ message: result.message }, { status: 401 });
    }

    return NextResponse.json({ account: result.account });
  } catch {
    return NextResponse.json({ message: 'Unable to sign in.' }, { status: 500 });
  }
}
