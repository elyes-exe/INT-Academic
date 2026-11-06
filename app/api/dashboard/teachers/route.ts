import { NextResponse } from 'next/server';
import { getAccountById, getTeachers } from '@/lib/server-accounts';
import { getAuthSessionAccountId } from '@/lib/server-auth-session';

export async function GET(request: Request) {
  const accountId = await getAuthSessionAccountId(request);
  const account = accountId ? await getAccountById(accountId) : null;

  if (!account || account.status !== 'verified' || (account.role !== 'admin' && account.role !== 'staff')) {
    return NextResponse.json({ message: 'Administrator or staff access is required.' }, { status: 403 });
  }

  return NextResponse.json({ teachers: await getTeachers() });
}
