'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Account,
  AccountRole,
  AccountStatus,
  getAccounts,
  getCurrentAccount,
  updateAccount,
} from '@/lib/local-auth';
import { useLanguage } from '@/lib/language-context';
import { classSectionOptions } from '@/lib/class-sections';

const roleOptions: AccountRole[] = ['student', 'prof', 'staff', 'admin'];
const statusOptions: AccountStatus[] = ['pending', 'verified', 'rejected'];

function statusBadgeClass(status: AccountStatus) {
  if (status === 'verified') {
    return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900';
  }

  if (status === 'rejected') {
    return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900';
  }

  return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900';
}

export default function AccountsPage() {
  const { language, t } = useLanguage();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadAccounts() {
      const [nextAccounts, nextCurrentAccount] = await Promise.all([
        getAccounts(),
        getCurrentAccount(),
      ]);

      if (isMounted) {
        setAccounts(nextAccounts);
        setCurrentAccount(nextCurrentAccount);
      }
    }

    loadAccounts();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredAccounts = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return accounts.filter((account) => {
      return (
        account.fullName.toLowerCase().includes(term) ||
        account.email.toLowerCase().includes(term) ||
        account.role.toLowerCase().includes(term) ||
        (account.className ?? '').toLowerCase().includes(term) ||
        account.status.toLowerCase().includes(term)
      );
    });
  }, [accounts, searchTerm]);

  const pendingCount = accounts.filter((account) => account.status === 'pending').length;

  const handleUpdate = async (accountId: string, changes: Partial<Pick<Account, 'role' | 'status' | 'className'>>) => {
    try {
      setUpdateError('');
      await updateAccount(accountId, changes);
      const [nextAccounts, nextCurrentAccount] = await Promise.all([
        getAccounts(),
        getCurrentAccount(),
      ]);

      setAccounts(nextAccounts);
      setCurrentAccount(nextCurrentAccount);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : t('Unable to update account.'));
    }
  };

  if (currentAccount && currentAccount.role !== 'admin') {
    return (
      <div className="p-8">
        <Card className="bg-card border border-border p-8 max-w-xl">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <ShieldAlert className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('Admin access required')}</h1>
              <p className="text-muted-foreground mt-2">
                {t('Account moderation is only available to verified admin users.')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('Account Moderation')}</h1>
          <p className="text-muted-foreground">{t('Verify student signups and adjust account roles')}</p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">{pendingCount} {t('pending')}</p>
            <p className="text-xs text-muted-foreground">{t('Waiting for verification')}</p>
          </div>
        </div>
      </div>

      <Card className="bg-card border border-border p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('Search by name, email, role, or status...')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10 bg-background text-foreground placeholder:text-muted-foreground border-border"
          />
        </div>
      </Card>

      {updateError && (
        <p role="alert" className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {updateError}
        </p>
      )}

      <Card className="bg-card border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-background/50 border-b border-border">
            <TableRow className="hover:bg-background/50">
              <TableHead className="text-foreground font-semibold">{t('Account')}</TableHead>
              <TableHead className="text-foreground font-semibold">{t('Role')}</TableHead>
              <TableHead className="text-foreground font-semibold">{t('Class')}</TableHead>
              <TableHead className="text-foreground font-semibold">{t('Status')}</TableHead>
              <TableHead className="text-foreground font-semibold">{t('Created')}</TableHead>
              <TableHead className="text-foreground font-semibold text-right">{t('Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((account) => (
                <TableRow key={account.id} className="hover:bg-background/50 border-b border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {account.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{account.fullName}</p>
                        <p className="text-sm text-muted-foreground">{account.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={account.role}
                      onValueChange={(role) => handleUpdate(account.id, { role: role as AccountRole })}
                    >
                      <SelectTrigger className="w-32 bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role} value={role}>
                            {t(role)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {account.role === 'student' ? (
                      <div className="space-y-1">
                        <Select
                          value={account.className || '__unassigned__'}
                          onValueChange={(className) => handleUpdate(account.id, { className: className === '__unassigned__' ? '' : className })}
                        >
                          <SelectTrigger className="w-64 max-w-[28vw] bg-background text-foreground">
                            <SelectValue placeholder={t('Assign class')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__unassigned__" disabled={account.status === 'verified'}>
                              {t('Unassigned')}
                            </SelectItem>
                            {account.className && !classSectionOptions.includes(account.className) && (
                              <SelectItem value={account.className}>{account.className}</SelectItem>
                            )}
                            {classSectionOptions.map((className) => (
                              <SelectItem key={className} value={className}>{className}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!account.className && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">{t('Assign a class before verifying')}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={account.status}
                      onValueChange={(status) => handleUpdate(account.id, { status: status as AccountStatus })}
                    >
                      <SelectTrigger className="w-36 bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status} disabled={status === 'verified' && account.role === 'student' && !account.className}>
                            {t(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Badge variant="outline" className={`mt-2 ${statusBadgeClass(account.status)}`}>
                      {t(account.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(account.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-2 border-border text-foreground"
                        onClick={() => handleUpdate(account.id, { status: 'verified' })}
                        disabled={account.role === 'student' && !account.className}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {t('Verify')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => handleUpdate(account.id, { status: 'rejected' })}
                      >
                        <XCircle className="w-4 h-4" />
                        {t('Reject')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t('No accounts found')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <UserCog className="w-4 h-4" />
        <span>{t('Total Accounts:')} <strong className="text-foreground">{filteredAccounts.length}</strong></span>
      </div>
    </div>
  );
}
