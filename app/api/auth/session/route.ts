import { NextResponse } from 'next/server';
import { clearAuthSession } from '@/lib/server-auth-session';

export async function DELETE() {
  return clearAuthSession(NextResponse.json({ success: true }));
}
