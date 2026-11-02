'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { AlertCircle, Lock, UserPlus } from 'lucide-react';
import { signIn } from '@/lib/local-auth';
import { useLanguage } from '@/lib/language-context';

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    setTimeout(async () => {
      const result = await signIn(email, password);

      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.message);
      }

      setIsLoading(false);
    }, 600);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate admin inputs
    if (!email || !password || !adminCode) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    const validAdminEmail = 'admin@int.edu';
    const validSecretCode = 'INT2024';

    setTimeout(async () => {
      if (email === validAdminEmail && adminCode === validSecretCode) {
        const result = await signIn(email, password);

        if (result.success && result.account.role === 'admin') {
          router.push('/dashboard');
        } else {
          setError(result.success ? 'This account is not an admin account.' : result.message);
        }
      } else {
        setError('Invalid email, password, or secret code');
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo Section */}
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
          <h1 className="text-3xl font-bold text-foreground">INT App</h1>
          <p className="text-muted-foreground">{t('Academic Management System')}</p>
        </div>

        {/* Main Login Card */}
        <Card className="p-8 bg-card border border-border shadow-md rounded-xl">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-900 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-300" />
                <span className="text-sm text-red-600 dark:text-red-300">{t(error)}</span>
              </div>
            )}

            {/* Email Field */}
            <FieldGroup>
              <Field>
                <FieldLabel>{t('Email Address')}</FieldLabel>
                <Input
                  type="email"
                  placeholder="your.email@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary text-foreground placeholder:text-muted-foreground border-border"
                  required
                />
              </Field>
            </FieldGroup>

            {/* Password Field */}
            <FieldGroup>
              <Field>
                <FieldLabel>{t('Password')}</FieldLabel>
                <Input
                  type="password"
                  placeholder={t('Enter your password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary text-foreground placeholder:text-muted-foreground border-border"
                  required
                />
              </Field>
            </FieldGroup>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-sm text-muted-foreground hover:text-primary">
                {t('Forgot password?')}
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 rounded-lg transition-all"
              disabled={isLoading}
            >
              {t(isLoading ? 'Logging in...' : 'Login')}
            </Button>
          </form>

          <div className="mt-5">
            <GoogleSignInButton />
          </div>

          {/* Admin Access Link */}
          <div className="mt-6 pt-6 border-t border-border">
            <Button asChild variant="outline" className="w-full mb-3 border-border text-foreground hover:bg-secondary">
              <Link href="/auth/signup">
                <UserPlus className="w-4 h-4 mr-2" />
                {t('Create Student Account')}
              </Link>
            </Button>
            <button
              type="button"
              onClick={() => setShowAdminModal(true)}
              className="w-full text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-3 h-3" />
              {t('Admin Access')}
            </button>
          </div>
        </Card>

        {/* Admin Login Modal */}
        {showAdminModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md p-8 bg-card border border-border shadow-lg rounded-xl">
              <div className="space-y-1 mb-6">
                <h2 className="text-xl font-bold text-foreground">{t('Admin Access')}</h2>
                <p className="text-sm text-muted-foreground">{t('Secure administrative login')}</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
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
                      placeholder="admin@institution.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                      placeholder={t('Enter your password')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-secondary text-foreground placeholder:text-muted-foreground border-border"
                      required
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel>{t('Secret Code')}</FieldLabel>
                    <Input
                      type="password"
                      placeholder={t('Enter secret code')}
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      className="bg-secondary text-foreground placeholder:text-muted-foreground border-border"
                      required
                    />
                  </Field>
                </FieldGroup>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-border"
                    onClick={() => {
                      setShowAdminModal(false);
                      setAdminCode('');
                      setError('');
                    }}
                  >
                    {t('Cancel')}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isLoading}
                  >
                    {t(isLoading ? 'Verifying...' : 'Access')}
                  </Button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900 rounded-lg">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">{t('Demo Admin Credentials:')}</p>
                  <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1 font-mono">
                    <p>{t('Email')}: admin@int.edu</p>
                    <p>{t('Password')}: admin123</p>
                    <p>{t('Secret Code')}: INT2024</p>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
