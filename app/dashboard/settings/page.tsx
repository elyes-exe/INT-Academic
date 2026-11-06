'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Database, Lock, UserCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { getCurrentAccount, updateAccountProfile } from '@/lib/local-auth';
import type { Account } from '@/lib/local-auth';
import { useLanguage } from '@/lib/language-context';
import { useRoleAccess } from '@/lib/use-role-access';

type Preferences = {
  notifications: boolean;
  emailAlerts: boolean;
  twoFactor: boolean;
};

type SystemSettings = Preferences & {
  instituteName: string;
  email: string;
  phone: string;
  address: string;
};

const defaultSystemSettings: SystemSettings = {
  instituteName: 'INT App',
  email: '',
  phone: '',
  address: '',
  notifications: true,
  emailAlerts: true,
  twoFactor: false,
};

export default function SettingsPage() {
  const { t } = useLanguage();
  const { role } = useRoleAccess();
  const [account, setAccount] = useState<Account | null>(null);
  const [profile, setProfile] = useState({ fullName: '', phone: '' });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(defaultSystemSettings);
  const [preferences, setPreferences] = useState<Preferences>(defaultSystemSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadSettings = async () => {
    const [currentAccount, preferencesResponse] = await Promise.all([
      getCurrentAccount(),
      fetch('/api/dashboard/settings'),
    ]);

    if (currentAccount) {
      setAccount(currentAccount);
      setProfile({
        fullName: currentAccount.fullName,
        phone: currentAccount.phone ?? '',
      });
    }

    if (preferencesResponse.ok) {
      const data = await preferencesResponse.json();

      if (data.settings) {
        setSystemSettings(data.settings);
        setPreferences({
          notifications: Boolean(data.settings.notifications),
          emailAlerts: Boolean(data.settings.emailAlerts),
          twoFactor: Boolean(data.settings.twoFactor),
        });
      }
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!account) {
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      const updatedAccount = await updateAccountProfile(account.id, profile);

      await fetch('/api/dashboard/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...systemSettings,
          ...preferences,
        }),
      });

      setAccount(updatedAccount);
      setProfile({
        fullName: updatedAccount.fullName,
        phone: updatedAccount.phone ?? '',
      });
      setMessage('Account information saved successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save account information.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('Settings')}</h1>
        <p className="text-muted-foreground">{t('Manage your account information and preferences')}</p>
      </div>

      <div className="mt-8 space-y-6">
        <Card className="bg-card border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <UserCircle className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">{t('My Account')}</h2>
          </div>

          <div className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>{t('Full Name')}</FieldLabel>
                <Input
                  value={profile.fullName}
                  onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
                  placeholder={t('Your full name')}
                />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel>{t('Email Address')}</FieldLabel>
                <Input type="email" value={account?.email ?? ''} disabled className="bg-secondary" />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel>{t('Phone Number')}</FieldLabel>
                <Input
                  value={profile.phone}
                  onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                  placeholder={t('Add your phone number')}
                />
              </Field>
            </FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Role')}</FieldLabel>
                  <Input value={t(account?.role ?? '')} disabled className="capitalize bg-secondary" />
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t('Account Status')}</FieldLabel>
                  <Input value={t(account?.status ?? '')} disabled className="capitalize bg-secondary" />
                </Field>
              </FieldGroup>
            </div>
          </div>
        </Card>

        <Card className="bg-card border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">{t('Notifications')}</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{t('Push Notifications')}</p>
                <p className="text-sm text-muted-foreground">{t('Receive push notifications for important updates')}</p>
              </div>
              <Switch
                checked={preferences.notifications}
                onCheckedChange={(checked) => setPreferences({ ...preferences, notifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="font-medium text-foreground">{t('Email Alerts')}</p>
                <p className="text-sm text-muted-foreground">{t('Receive email notifications for events and changes')}</p>
              </div>
              <Switch
                checked={preferences.emailAlerts}
                onCheckedChange={(checked) => setPreferences({ ...preferences, emailAlerts: checked })}
              />
            </div>
          </div>
        </Card>

        <Card className="bg-card border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">{t('Security')}</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{t('Two-Factor Authentication')}</p>
              <p className="text-sm text-muted-foreground">{t('Add an extra layer of security to your account')}</p>
            </div>
            <Switch
              checked={preferences.twoFactor}
              onCheckedChange={(checked) => setPreferences({ ...preferences, twoFactor: checked })}
            />
          </div>
        </Card>

        {role === 'admin' && <Card className="bg-card border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">{t('User Management')}</h2>
          </div>
          <div className="space-y-3">
            <Button asChild variant="outline" className="w-full text-foreground border-border hover:bg-secondary justify-start">
              <Link href="/dashboard/accounts">{t('Manage Account Verification')}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full text-foreground border-border hover:bg-secondary justify-start">
              <Link href="/dashboard/accounts">{t('Set User Permissions')}</Link>
            </Button>
          </div>
        </Card>}

        <Card className="bg-card border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">{t('Data Management')}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{t('Application data is stored in XAMPP MySQL database `int_app`.')}</p>
        </Card>

        <div className="flex flex-col gap-3 pt-6 md:flex-row md:items-center md:justify-between">
          <p className={message.includes('successfully') ? 'text-sm text-green-700 dark:text-green-300' : 'text-sm text-destructive'}>
            {t(message)}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={loadSettings}
              className="text-foreground border-border hover:bg-secondary"
            >
              {t('Cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!account || isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {t(isSaving ? 'Saving...' : 'Save Changes')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
