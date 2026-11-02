import { NextResponse } from 'next/server';
import { createStudentAccount } from '@/lib/server-accounts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = typeof body.fullName === 'string' ? body.fullName : '';
    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!fullName || !email || !password) {
      return NextResponse.json({ message: 'Name, email, and password are required.' }, { status: 400 });
    }

    const result = await createStudentAccount({ fullName, email, password });

    if (!result.success) {
      return NextResponse.json({ message: result.message }, { status: 409 });
    }

    return NextResponse.json({ account: result.account });
  } catch {
    return NextResponse.json({ message: 'Unable to create account.' }, { status: 500 });
  }
}
