import { NextResponse } from 'next/server';
import { VerificationPurpose, verifyEmailCode } from '@/lib/server-verification-codes';

function isValidPurpose(purpose: unknown): purpose is VerificationPurpose {
  return purpose === 'signup' || purpose === 'password-reset';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const verificationId = typeof body.verificationId === 'string' ? body.verificationId : '';
    const email = typeof body.email === 'string' ? body.email : '';
    const code = typeof body.code === 'string' ? body.code : '';
    const purpose = body.purpose;

    if (!verificationId || !email || !code || !isValidPurpose(purpose)) {
      return NextResponse.json({ message: 'Verification details are required.' }, { status: 400 });
    }

    const result = verifyEmailCode({ verificationId, email, code, purpose });

    if (!result.success) {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }

    return NextResponse.json({ verified: true });
  } catch {
    return NextResponse.json({ message: 'Unable to verify code.' }, { status: 500 });
  }
}
