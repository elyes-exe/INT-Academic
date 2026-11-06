import { NextResponse } from 'next/server';
import {
  createResource,
  deleteResource,
  listResource,
  updateResource,
} from '@/lib/dashboard-data';
import { getAccountById } from '@/lib/server-accounts';
import { getAuthSessionAccountId } from '@/lib/server-auth-session';

type RouteContext = {
  params: Promise<{ resource: string }>;
};

async function getVerifiedRequestAccount(request: Request) {
  const accountId = await getAuthSessionAccountId(request);
  if (!accountId) return null;

  const account = await getAccountById(accountId);
  return account?.status === 'verified' ? account : null;
}

export async function GET(request: Request, context: RouteContext) {
  const account = await getVerifiedRequestAccount(request);
  if (!account) {
    return NextResponse.json({ message: 'A verified account is required.' }, { status: 401 });
  }

  if (account.role === 'student' && !account.className) {
    return NextResponse.json({ message: 'Your account must be assigned to a class first.' }, { status: 403 });
  }

  const { resource } = await context.params;
  const data = await listResource(resource, account.role === 'student' ? account.className : undefined);

  if (!data) {
    return NextResponse.json({ message: 'Resource not found.' }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request, context: RouteContext) {
  const account = await getVerifiedRequestAccount(request);
  if (!account || (account.role !== 'admin' && account.role !== 'staff')) {
    return NextResponse.json({ message: 'Only administrators and staff can change dashboard records.' }, { status: 403 });
  }
  const { resource } = await context.params;
  const body = await request.json();
  const item = await createResource(resource, body);

  if (!item) {
    return NextResponse.json({ message: 'Resource not found.' }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function PUT(request: Request, context: RouteContext) {
  const account = await getVerifiedRequestAccount(request);
  if (!account || (account.role !== 'admin' && account.role !== 'staff')) {
    return NextResponse.json({ message: 'Only administrators and staff can change dashboard records.' }, { status: 403 });
  }
  const { resource } = await context.params;
  const body = await request.json();
  const id = String(body.id ?? '');

  if (!id) {
    return NextResponse.json({ message: 'Item id is required.' }, { status: 400 });
  }

  const item = await updateResource(resource, id, body);

  if (!item) {
    return NextResponse.json({ message: 'Resource or item not found.' }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function DELETE(request: Request, context: RouteContext) {
  const account = await getVerifiedRequestAccount(request);
  if (!account || (account.role !== 'admin' && account.role !== 'staff')) {
    return NextResponse.json({ message: 'Only administrators and staff can change dashboard records.' }, { status: 403 });
  }
  const { resource } = await context.params;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') ?? '';

  if (!id) {
    return NextResponse.json({ message: 'Item id is required.' }, { status: 400 });
  }

  const deleted = await deleteResource(resource, id);

  if (!deleted) {
    return NextResponse.json({ message: 'Resource not found.' }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
