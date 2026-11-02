import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getOrCreateGoogleAccount } from '@/lib/server-accounts';

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { message: 'Google sign-in needs the Supabase URL and anon key configured.' },
      { status: 503 },
    );
  }

  const accessToken = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!accessToken) {
    return NextResponse.json({ message: 'A Google sign-in session is required.' }, { status: 401 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
    const { data, error } = await supabase.auth.getUser(accessToken);
    const user = data.user;

    if (error || !user) {
      return NextResponse.json({ message: 'Google sign-in could not be verified.' }, { status: 401 });
    }

    const hasGoogleIdentity =
      user.app_metadata?.provider === 'google' ||
      user.identities?.some((identity) => identity.provider === 'google');

    if (!hasGoogleIdentity || !user.email || !user.email_confirmed_at) {
      return NextResponse.json(
        { message: 'A verified Google email address is required.' },
        { status: 403 },
      );
    }

    const fullName =
      (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
      (typeof user.user_metadata?.name === 'string' && user.user_metadata.name) ||
      user.email.split('@')[0];

    const account = await getOrCreateGoogleAccount({ email: user.email, fullName });
    return NextResponse.json({ account });
  } catch {
    return NextResponse.json({ message: 'Unable to complete Google sign-in.' }, { status: 500 });
  }
}
