'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    // Redirect to login page
    router.push('/auth/login');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">INT App</h1>
        <p className="text-muted-foreground">{t('Redirecting to login...')}</p>
      </div>
    </div>
  );
}
