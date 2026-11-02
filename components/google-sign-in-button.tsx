'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createSupabaseClient } from '@/lib/supabase';
import { useLanguage } from '@/lib/language-context';

type GoogleSignInButtonProps = {
  label?: string;
};

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-4">
      <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11.1a9.5 9.5 0 0 1-4.1 6.2l6.5 5c3.8-3.5 6.1-8.7 6.1-14.9Z" />
      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.5-5c-1.8 1.2-4.1 2-7 2-5.3 0-9.8-3.6-11.4-8.4l-6.7 5.2A20 20 0 0 0 24 44Z" />
      <path fill="#FBBC05" d="M12.6 27.7a12 12 0 0 1 0-7.4l-6.7-5.2a20 20 0 0 0 0 17.8l6.7-5.2Z" />
      <path fill="#EA4335" d="M24 11.9c3 0 5.7 1 7.8 3l5.8-5.8C34.1 5.8 29.5 4 24 4A20 20 0 0 0 5.9 15.1l6.7 5.2c1.6-4.8 6.1-8.4 11.4-8.4Z" />
    </svg>
  );
}

function getUserMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';

  if (/missing supabase env vars/i.test(message)) {
    return 'Google sign-in needs the Supabase URL and anon key configured.';
  }

  if (/unsupported provider|provider.*not enabled/i.test(message)) {
    return 'Google sign-in is not enabled for this Supabase project yet.';
  }

  return message || 'Unable to start Google sign-in.';
}

export function GoogleSignInButton({ label = 'Continue with Google' }: GoogleSignInButtonProps) {
  const { t } = useLanguage();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      const supabase = createSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/google/callback`,
        },
      });

      if (signInError) {
        throw signInError;
      }
    } catch (signInError) {
      setError(getUserMessage(signInError));
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{t('or')}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full bg-background text-foreground"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        <GoogleMark />
        {t(isLoading ? 'Connecting to Google…' : label)}
      </Button>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {t(error)}
        </p>
      )}
    </div>
  );
}
