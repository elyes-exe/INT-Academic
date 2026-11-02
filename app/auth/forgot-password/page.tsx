'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { findAccountByEmail, updateAccountPassword } from '@/lib/local-auth';
import { useLanguage } from '@/lib/language-context';

type ResetStep = 'email' | 'verify' | 'complete';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const requestResetCode = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    if (!(await findAccountByEmail(email))) {
      setError('No account was found with this email address.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          purpose: 'password-reset',
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Unable to send reset code.');
        return;
      }

      setVerificationId(data.verificationId);
      setDevCode(data.devCode || '');
      setStep('verify');
    } catch {
      setError('Unable to send reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!code || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
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
          purpose: 'password-reset',
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Invalid reset code.');
        return;
      }

      await updateAccountPassword(email, newPassword);
      setStep('complete');
    } catch {
      setError('Unable to reset password.');
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
          <h1 className="text-3xl font-bold text-foreground">{t('Reset password')}</h1>
          <p className="text-muted-foreground">{t('Use an email code to secure your account')}</p>
        </div>

        <Card className="p-8 bg-card border border-border shadow-md rounded-xl">
          {step === 'email' && (
            <form onSubmit={requestResetCode} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-300" />
                  <span className="text-sm text-red-600 dark:text-red-300">{t(error)}</span>
                </div>
              )}

              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Email Address')}</FieldLabel>
                  <Input
                    type="email"
                    placeholder="your.email@institution.edu"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
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
                {t(isLoading ? 'Sending code...' : 'Send Reset Code')}
              </Button>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={resetPassword} className="space-y-5">
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
                  <p className="text-sm text-muted-foreground">{t('We sent a password reset code to')} {email}.</p>
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
                  <FieldLabel>{t('Reset Code')}</FieldLabel>
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

              <FieldGroup>
                <Field>
                  <FieldLabel>{t('New Password')}</FieldLabel>
                  <Input
                    type="password"
                    placeholder={t('Create a new password')}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="bg-secondary text-foreground placeholder:text-muted-foreground border-border"
                    required
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Confirm New Password')}</FieldLabel>
                  <Input
                    type="password"
                    placeholder={t('Confirm your new password')}
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
                <KeyRound className="w-4 h-4 mr-2" />
                {t(isLoading ? 'Resetting...' : 'Reset Password')}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground hover:text-primary"
                onClick={() => requestResetCode()}
                disabled={isLoading}
              >
                {t('Send another code')}
              </Button>
            </form>
          )}

          {step === 'complete' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 dark:bg-green-950/40 dark:border-green-900 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-300" />
                <span className="text-sm text-green-700 dark:text-green-300">{t('Your password has been reset.')}</span>
              </div>
              <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/auth/login">{t('Return to Login')}</Link>
              </Button>
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
