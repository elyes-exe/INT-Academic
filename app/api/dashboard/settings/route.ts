import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/dashboard-data';

export async function GET() {
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(request: Request) {
  const body = await request.json();
  return NextResponse.json({ settings: await updateSettings(body) });
}
