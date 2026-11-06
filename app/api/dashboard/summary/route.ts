import { NextResponse } from 'next/server';
import { getDashboardSummary } from '@/lib/dashboard-data';
import { getAccountById } from '@/lib/server-accounts';
import { getAuthSessionAccountId } from '@/lib/server-auth-session';

export async function GET(request: Request) {
  const accountId = await getAuthSessionAccountId(request);
  const account = accountId ? await getAccountById(accountId) : null;

  if (!account || account.status !== 'verified') {
    return NextResponse.json({ message: 'A verified account is required.' }, { status: 401 });
  }

  const summary = await getDashboardSummary();

  if (account.role !== 'admin') {
    summary.recentActivity = [];
    summary.latestAnnouncements = [];
  }

  return NextResponse.json(summary);
}
