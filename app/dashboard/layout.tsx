'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { getCurrentAccount } from '@/lib/local-auth';
import { useLanguage } from '@/lib/language-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsReady(false);

    async function checkAccess() {
      const account = await getCurrentAccount();

      if (!isMounted) {
        return;
      }

      if (!account) {
        router.replace('/auth/login');
        return;
      }

      if (account.status !== 'verified') {
        router.replace('/auth/pending');
        return;
      }

      if (account.role === 'student' && pathname.startsWith('/dashboard/staff')) {
        router.replace('/dashboard');
        return;
      }

      setIsReady(true);
    }

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
        {t('Checking account access...')}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
