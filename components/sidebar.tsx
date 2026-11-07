'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  DoorOpen,
  FileText,
  Megaphone,
  Settings,
  UserCog,
  BookOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Account, getCurrentAccount } from '@/lib/local-auth';
import { useLanguage } from '@/lib/language-context';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  managerOnly?: boolean;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Students', href: '/dashboard/students', icon: Users },
  { label: 'Staff', href: '/dashboard/staff', icon: UserCheck, managerOnly: true },
  { label: 'Timetable', href: '/dashboard/timetable', icon: Calendar },
  { label: 'Classrooms', href: '/dashboard/classrooms', icon: DoorOpen },
  { label: 'Exams', href: '/dashboard/exams', icon: FileText },
  { label: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
  { label: 'Accounts', href: '/dashboard/accounts', icon: UserCog, adminOnly: true },
  { label: 'Subjects', href: '/dashboard/subjects', icon: BookOpen, adminOnly: true },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAccount() {
      const currentAccount = await getCurrentAccount();

      if (isMounted) {
        setAccount(currentAccount);
      }
    }

    loadAccount();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleNavItems = navItems.filter((item) => {
    if (item.adminOnly && account?.role !== 'admin') {
      return false;
    }

    if (item.managerOnly && account?.role !== 'admin' && account?.role !== 'staff') {
      return false;
    }

    return true;
  });

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col shadow-sm">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="INT App Logo"
            width={40}
            height={40}
            loading="eager"
            priority
          />
          <div>
            <h1 className="text-lg font-bold text-foreground">INT</h1>
            <p className="text-xs text-muted-foreground">{t('Academic')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm font-medium',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground hover:bg-primary/5 text-opacity-80'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t(item.label)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-primary/5">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            U
          </div>
          <div className="text-sm flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{account?.fullName ?? 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{account?.email ?? 'user@int.edu'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
