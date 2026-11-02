'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Clock3, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/lib/language-context';

export default function PendingAccountPage() {
  const { t } = useLanguage();
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
          <h1 className="text-3xl font-bold text-foreground">{t('Verification pending')}</h1>
          <p className="text-muted-foreground">{t('An administrator must verify your student account first')}</p>
        </div>

        <Card className="p-8 bg-card border border-border shadow-md rounded-xl">
          <div className="flex items-start gap-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="mt-1 rounded-full bg-primary text-primary-foreground p-2">
              <Clock3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{t('Waiting for approval')}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t('Your account was created as a student account. You can sign in after an admin marks it as verified.')}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="w-4 h-4 text-primary" />
              {t('Admin review')}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {t('Admins can verify accounts and adjust roles from the Accounts page inside the dashboard.')}
            </p>
          </div>

          <Button asChild className="mt-6 w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/auth/login">{t('Return to login')}</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
