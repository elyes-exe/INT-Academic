import { NextResponse } from 'next/server';
import { getDashboardSummary } from '@/lib/dashboard-data';

export async function GET() {
  return NextResponse.json(await getDashboardSummary());
}
