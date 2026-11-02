'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Account } from '@/lib/auth-types';
import { setCurrentAccount } from '@/lib/local-auth';
import { createSupabaseClient } from '@/lib/supabase';
import { useLanguage } from '@/lib/language-context';

type GoogleAccountResponse = {
  account?: Account;
  message?: string;
};

export default function GoogleCallbackPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;
    let isMounted = true;

    async function completeSignIn() {
      try {
        const supabase = createSupabaseClient();
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !data.session) {
          throw new Error('Google did not return a valid sign-in session. Please try again.');
        }

        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        });
        const result = (await response.json()) as GoogleAccountResponse;

        if (!response.ok || !result.account) {
          throw new Error(result.message || 'Unable to finish Google sign-in.');
        }

        if (!isMounted) {
          return;
        }

        setCurrentAccount(result.account);
        router.replace(result.account.status === 'verified' ? '/dashboard' : '/auth/pending');
      } catch (callbackError) {
        if (isMounted) {
          setError(
            callbackError instanceof Error
              ? callbackError.message
              : 'Unable to finish Google sign-in.',
          );
        }
      }
    }

    void completeSignIn();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-5 bg-card p-8 text-center">
        {error ? (
          <>
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-5" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-foreground">{t('Google sign-in failed')}</h1>
              <p className="text-sm text-muted-foreground" role="alert">{t(error)}</p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">
                <ArrowLeft className="size-4" />
                {t('Back to login')}
              </Link>
            </Button>
          </>
        ) : (
          <>
            <LoaderCircle className="mx-auto size-8 animate-spin text-primary" aria-hidden="true" />
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-foreground">{t('Signing you in')}</h1>
              <p className="text-sm text-muted-foreground">{t('Finishing your Google sign-in…')}</p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
