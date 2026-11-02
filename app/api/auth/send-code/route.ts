import { NextResponse } from 'next/server';
import { createVerificationCode, VerificationPurpose } from '@/lib/server-verification-codes';
import { sendEmail } from '@/lib/server-email';

function isValidPurpose(purpose: unknown): purpose is VerificationPurpose {
  return purpose === 'signup' || purpose === 'password-reset';
}

function emailSubject(purpose: VerificationPurpose) {
  return purpose === 'signup' ? 'Verify your INT App account' : 'Reset your INT App password';
}

function emailBody(purpose: VerificationPurpose, code: string, fullName?: string) {
  const greeting = fullName ? `Hello ${fullName},` : 'Hello,';
  const action =
    purpose === 'signup'
      ? 'Use this code to verify your email address and finish creating your student account.'
      : 'Use this code to confirm your password reset request.';

  return {
    text: `${greeting}\n\n${action}\n\nVerification code: ${code}\n\nThis code expires in 15 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <p>${greeting}</p>
        <p>${action}</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 24px 0;">${code}</p>
        <p style="color: #6b7280;">This code expires in 15 minutes.</p>
      </div>
    `,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : undefined;
    const purpose = body.purpose;

    if (!email || !isValidPurpose(purpose)) {
      return NextResponse.json(
        { message: 'Email and verification purpose are required.' },
        { status: 400 },
      );
    }

    const { verificationId, code } = createVerificationCode(email, purpose);
    const content = emailBody(purpose, code, fullName);
    const result = await sendEmail({
      to: email,
      subject: emailSubject(purpose),
      html: content.html,
      text: content.text,
    });

    if (!result.success) {
      if (result.providerBlocked && process.env.NODE_ENV !== 'production') {
        return NextResponse.json({
          verificationId,
          devMode: true,
          devCode: code,
          message:
            'Resend is still in sender verification mode. Use this development code locally, or verify a sending domain in Resend to send real emails.',
        });
      }

      return NextResponse.json({ message: result.message }, { status: 502 });
    }

    return NextResponse.json({
      verificationId,
      devMode: result.devMode,
      devCode: result.devMode ? code : undefined,
      message: result.devMode
        ? 'Email API is not configured. Use the development code shown on screen.'
        : 'Verification email sent.',
    });
  } catch {
    return NextResponse.json({ message: 'Unable to send verification email.' }, { status: 500 });
  }
}
