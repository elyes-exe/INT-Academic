'use client';

import { useRouter } from 'next/navigation';
import { Bell, Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { signOut } from '@/lib/local-auth';
import { useLanguage } from '@/lib/language-context';

export function Header() {
  const router = useRouter();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shadow-sm">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('Search...')}
            className="pl-10 bg-secondary text-foreground placeholder:text-muted-foreground border-border focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-auto">
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        {/* Notifications */}
        <button aria-label={t('Notifications')} title={t('Notifications')} className="relative p-2 hover:bg-primary/5 rounded-lg transition-all text-foreground hover:text-primary">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </button>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2 text-foreground hover:bg-primary/5 hover:text-primary transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('Logout')}</span>
        </Button>
      </div>
    </header>
  );
}
