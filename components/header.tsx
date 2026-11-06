'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Search, LogOut, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { getCurrentAccount, signOut } from '@/lib/local-auth';
import { useLanguage } from '@/lib/language-context';
import { fetchResource } from '@/lib/dashboard-client';

type NotificationAnnouncement = {
  id: number;
  title: string;
  content: string;
  target: string;
  date: string;
};

export function Header() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationAnnouncement[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<number[]>([]);
  const [accountId, setAccountId] = useState('');
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState('');

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getCurrentAccount(),
      fetchResource<NotificationAnnouncement>('announcements'),
    ]).then(([account, items]) => {
      if (!isMounted) return;
      const nextAccountId = account?.id ?? '';
      setAccountId(nextAccountId);
      setNotifications(items.slice(0, 10));
      setHasLoadedNotifications(true);
      try {
        const savedReadIds = nextAccountId
          ? window.localStorage.getItem(`intReadAnnouncements:${nextAccountId}`)
          : null;
        const parsedReadIds: unknown = savedReadIds ? JSON.parse(savedReadIds) : [];
        setReadNotificationIds(Array.isArray(parsedReadIds)
          ? parsedReadIds.filter((id): id is number => typeof id === 'number')
          : []);
      } catch {
        setReadNotificationIds([]);
      }
    }).catch((error) => {
      if (isMounted) {
        setNotificationError(error instanceof Error ? error.message : t('Unable to load notifications.'));
      }
    });

    return () => { isMounted = false; };
  }, [t]);

  useEffect(() => {
    if (!isNotificationsOpen) return;
    let isMounted = true;
    setIsLoadingNotifications(true);
    setNotificationError('');

    fetchResource<NotificationAnnouncement>('announcements')
      .then((items) => {
        if (!isMounted) return;
        const visibleItems = items.slice(0, 10);
        setNotifications(visibleItems);
        setHasLoadedNotifications(true);
        const nextReadIds = visibleItems.map((item) => item.id);
        setReadNotificationIds(nextReadIds);
        if (accountId) {
          try {
            window.localStorage.setItem(`intReadAnnouncements:${accountId}`, JSON.stringify(nextReadIds));
          } catch {
            // The panel remains usable when browser storage is disabled.
          }
        }
      })
      .catch((error) => {
        if (isMounted) setNotificationError(error instanceof Error ? error.message : t('Unable to load notifications.'));
      })
      .finally(() => {
        if (isMounted) setIsLoadingNotifications(false);
      });

    return () => { isMounted = false; };
  }, [isNotificationsOpen, accountId, t]);

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
        <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('Notifications')}
              aria-expanded={isNotificationsOpen}
              title={t('Notifications')}
              className="relative text-foreground hover:bg-primary/5 hover:text-primary"
            >
              <Bell className="w-5 h-5" />
              {(!hasLoadedNotifications || notifications.some((item) => !readNotificationIds.includes(item.id))) && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="font-semibold">{t('Notifications')}</h2>
              <span className="text-xs text-muted-foreground">{notifications.length}</span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {isLoadingNotifications ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t('Loading notifications...')}</p>
              ) : notificationError ? (
                <p role="alert" className="px-4 py-8 text-center text-sm text-destructive">{notificationError}</p>
              ) : notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t('No notifications yet')}</p>
              ) : notifications.map((item) => (
                <article key={item.id} className="border-b border-border px-4 py-3 last:border-0">
                  <div className="flex items-start gap-3">
                    <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium">{item.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.content}</p>
                      <time className="mt-2 block text-xs text-muted-foreground">{item.date}</time>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="border-t border-border p-3">
              <Button asChild variant="outline" className="w-full" onClick={() => setIsNotificationsOpen(false)}>
                <Link href="/dashboard/announcements">{t('View all announcements')}</Link>
              </Button>
            </div>
          </PopoverContent>
        </Popover>

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
