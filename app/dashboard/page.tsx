'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Calendar,
  DoorOpen,
  FileText,
  Megaphone,
  UserCheck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/lib/language-context';
import { getCurrentAccount, type AccountRole } from '@/lib/local-auth';

type DashboardSummary = {
  counts: {
    students: number;
    staff: number;
    classrooms: number;
    exams: number;
    announcements: number;
    timetable: number;
    accounts: number;
    pendingAccounts: number;
  };
  latestAnnouncements: {
    id?: number;
    title: string;
    content: string;
    target: string;
    priority: string;
    date: string;
  }[];
  recentActivity: {
    action: string;
    resource: string;
    itemLabel?: string | null;
    createdAt: string;
  }[];
};

const defaultSummary: DashboardSummary = {
  counts: {
    students: 0,
    staff: 0,
    classrooms: 0,
    exams: 0,
    announcements: 0,
    timetable: 0,
    accounts: 0,
    pendingAccounts: 0,
  },
  latestAnnouncements: [],
  recentActivity: [],
};

function formatTime(value: string, locale: string) {
  try {
    return new Date(value).toLocaleString(locale);
  } catch {
    return value;
  }
}

export default function Dashboard() {
  const { language, t } = useLanguage();
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [accountRole, setAccountRole] = useState<AccountRole | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');

  useEffect(() => {
    let isMounted = true;

    getCurrentAccount().then((account) => {
      if (isMounted) {
        setAccountRole(account?.role ?? null);
        if (account?.role === 'student') {
          setStudentName(account.fullName);
          setStudentClass(account.className ?? '');
        }
      }
    });

    async function loadSummary() {
      const response = await fetch('/api/dashboard/summary');

      if (response.ok) {
        setSummary(await response.json());
      }
    }

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const quickLinks = [
    { label: 'Students', href: '/dashboard/students', icon: Users, count: summary.counts.students },
    { label: 'Staff', href: '/dashboard/staff', icon: UserCheck, count: summary.counts.staff },
    { label: 'Timetable', href: '/dashboard/timetable', icon: Calendar, count: summary.counts.timetable },
    { label: 'Announcements', href: '/dashboard/announcements', icon: Megaphone, count: summary.counts.announcements },
  ];
  const visibleQuickLinks = accountRole === 'admin' || accountRole === 'staff'
    ? quickLinks
    : quickLinks.filter((link) => link.href !== '/dashboard/staff');

  const extraStats = [
    { label: 'Classrooms', value: summary.counts.classrooms, icon: DoorOpen },
    { label: 'Exams', value: summary.counts.exams, icon: FileText },
    { label: 'Accounts', value: summary.counts.accounts, icon: Users },
    { label: 'Pending approvals', value: summary.counts.pendingAccounts, icon: UserCheck },
  ];

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-2">{t('Welcome to INT App')}</h1>
        <p className="text-muted-foreground text-lg">
          {accountRole === 'student'
            ? `${studentName} · ${t('Your section')}: ${studentClass}`
            : t('Manage your academic institution efficiently')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {visibleQuickLinks.map((link) => {
          const Icon = link.icon;

          return (
            <Link key={link.href} href={link.href}>
              <Card className="p-6 bg-card border border-border hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                <div className="flex flex-col items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary text-primary-foreground">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t(link.label)}</p>
                    <p className="text-3xl font-bold text-primary mt-2">{link.count}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary mt-auto ml-auto" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        {extraStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label} className="bg-card border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{t(stat.label)}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 p-8 rounded-xl">
        <h2 className="text-2xl font-bold text-foreground mb-4">{t('Getting Started')}</h2>
        <p className="text-foreground mb-6">{t('INT App is your comprehensive academic management system. Use the sidebar to navigate to different sections and manage your institution\'s data.')}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
              {t('Navigate')}
            </h3>
            <p className="text-sm text-muted-foreground">{t('Use the sidebar menu to access different modules')}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
              {t('Manage')}
            </h3>
            <p className="text-sm text-muted-foreground">{t('Add, edit, or remove records as needed')}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">3</span>
              {t('Organize')}
            </h3>
            <p className="text-sm text-muted-foreground">{t('Keep your institution organized and up-to-date')}</p>
          </div>
        </div>
      </Card>

      {accountRole === 'admin' && <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border border-border p-6 rounded-xl">
          <h2 className="text-lg font-bold text-foreground mb-6">{t('Recent Activity')}</h2>
          {summary.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {summary.recentActivity.map((activity, index) => (
                <div key={`${activity.createdAt}-${index}`} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {t(activity.resource)} {t(activity.action)}
                      {activity.itemLabel ? `: ${activity.itemLabel}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{formatTime(activity.createdAt, language === 'fr' ? 'fr-FR' : 'en-US')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <p className="text-muted-foreground">{t('No recent activity yet')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('Activity will appear here as you manage records')}</p>
            </div>
          )}
        </Card>

        <Card className="bg-card border border-border p-6 rounded-xl">
          <h2 className="text-lg font-bold text-foreground mb-6">{t('Latest Announcements')}</h2>
          {summary.latestAnnouncements.length > 0 ? (
            <div className="space-y-3">
              {summary.latestAnnouncements.map((announcement) => (
                <div key={announcement.id ?? announcement.title} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {announcement.priority}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{announcement.content}</p>
                  <p className="text-xs text-muted-foreground mt-3">
                    {announcement.target} - {announcement.date}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Megaphone className="w-6 h-6 text-primary" />
              </div>
              <p className="text-muted-foreground">{t('No announcements yet')}</p>
              <Button asChild className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/dashboard/announcements">{t('Create Announcement')}</Link>
              </Button>
            </div>
          )}
        </Card>
      </div>}
    </div>
  );
}
