import { NextResponse } from 'next/server';
import {
  createResource,
  deleteResource,
  listResource,
  updateResource,
} from '@/lib/dashboard-data';

type RouteContext = {
  params: Promise<{ resource: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { resource } = await context.params;
  const data = await listResource(resource);

  if (!data) {
    return NextResponse.json({ message: 'Resource not found.' }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request, context: RouteContext) {
  const { resource } = await context.params;
  const body = await request.json();
  const item = await createResource(resource, body);

  if (!item) {
    return NextResponse.json({ message: 'Resource not found.' }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function PUT(request: Request, context: RouteContext) {
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
