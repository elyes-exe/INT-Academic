'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, MailCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { createStudentAccount, findAccountByEmail } from '@/lib/local-auth';
import { useLanguage } from '@/lib/language-context';

type SignupStep = 'details' | 'verify' | 'created';

export default function SignupPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>('details');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [devCode, setDevCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateDetails = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      return 'Please fill in all fields.';
    }

    if (await findAccountByEmail(email)) {
      return 'An account with this email already exists.';
    }

    if (password.length < 6) {
      return 'Password must be at least 6 characters.';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return '';
  };

  const requestVerificationCode = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setError('');

    const validationError = await validateDetails();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          purpose: 'signup',
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Unable to send verification code.');
        return;
      }

      setVerificationId(data.verificationId);
      setDevCode(data.devCode || '');
      setStep('verify');
    } catch {
      setError('Unable to send verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndCreateAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!verificationId || !code) {
      setError('Enter the verification code sent to your email.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId,
          email,
          code,
          purpose: 'signup',
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Invalid verification code.');
        return;
      }

      const result = await createStudentAccount({ fullName, email, password });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setStep('created');

      setTimeout(() => {
        router.push('/auth/pending');
      }, 900);
    } catch {
      setError('Unable to verify code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="INT App Logo"
              width={80}
              height={80}
              priority
              loading="eager"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t('Create student account')}</h1>
          <p className="text-muted-foreground">{t('Verify your email, then wait for admin approval')}</p>
        </div>

        <Card className="p-8 bg-card border border-border shadow-md rounded-xl">
          {step === 'details' && (
            <form onSubmit={requestVerificationCode} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-300" />
                  <span className="text-sm text-red-600 dark:text-red-300">{t(error)}</span>
                </div>
              )}

              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Full Name')}</FieldLabel>
                  <Input
                    placeholder={t('Enter your full name')}
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="bg-secondary text-foreground placeholder:text-muted-foreground border-border"
                    required
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Email Address')}</FieldLabel>
                  <Input
                    type="email"
                    placeholder="student@int.edu"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="bg-secondary text-foreground placeholder:text-muted-foreground border-border"
                    required
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Password')}</FieldLabel>
                  <Input
                    type="password"
                    placeholder={t('Create a password')}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="bg-secondary text-foreground placeholder:text-muted-foreground border-border"
                    required
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Confirm Password')}</FieldLabel>
                  <Input
                    type="password"
                    placeholder={t('Confirm your password')}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="bg-secondary text-foreground placeholder:text-muted-foreground border-border"
                    required
                  />
                </Field>
              </FieldGroup>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 rounded-lg transition-all"
                disabled={isLoading}
              >
                <MailCheck className="w-4 h-4 mr-2" />
                {t(isLoading ? 'Sending code...' : 'Send Verification Code')}
              </Button>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={verifyAndCreateAccount} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-300" />
                  <span className="text-sm text-red-600 dark:text-red-300">{t(error)}</span>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <MailCheck className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t('Check your email')}</p>
                  <p className="text-sm text-muted-foreground">{t('We sent a 6-digit code to')} {email}.</p>
                </div>
              </div>

              {devCode && (
                <div className="p-3 bg-blue-50 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900 rounded-lg">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">{t('Development Code')}</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-mono">{devCode}</p>
                </div>
              )}

              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Verification Code')}</FieldLabel>
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    placeholder={t('Enter 6-digit code')}
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    className="bg-secondary text-foreground placeholder:text-muted-foreground border-border"
                    required
                  />
                </Field>
              </FieldGroup>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 rounded-lg transition-all"
                disabled={isLoading}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {t(isLoading ? 'Verifying...' : 'Verify and Create Account')}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground hover:text-primary"
                onClick={() => requestVerificationCode()}
                disabled={isLoading}
              >
                {t('Send another code')}
              </Button>
            </form>
          )}

          {step === 'created' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 dark:bg-green-950/40 dark:border-green-900 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-300" />
                <span className="text-sm text-green-700 dark:text-green-300">{t('Email verified. Your account is waiting for admin approval.')}</span>
              </div>
              <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/auth/pending">{t('View Status')}</Link>
              </Button>
            </div>
          )}

          {step === 'details' && (
            <div className="mt-5">
              <GoogleSignInButton label="Sign up with Google" />
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-border">
            <Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-primary">
              <Link href="/auth/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('Back to login')}
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
