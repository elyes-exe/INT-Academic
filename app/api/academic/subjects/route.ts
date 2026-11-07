import { NextResponse } from 'next/server';
import {
  DEFAULT_ACADEMIC_YEAR,
  deleteAcademicSubject,
  listAcademicSubjects,
  listClassSubjects,
  saveAcademicSubject,
} from '@/lib/server-academics';
import { getAccountById } from '@/lib/server-accounts';
import { getAuthSessionAccountId } from '@/lib/server-auth-session';

async function getVerifiedAccount(request: Request) {
  const id = await getAuthSessionAccountId(request);
  const account = id ? await getAccountById(id) : null;
  return account?.status === 'verified' ? account : null;
}

async function isAdministrator(request: Request) {
  const account = await getVerifiedAccount(request);
  return account?.role === 'admin' ? account : null;
}

export async function GET(request: Request) {
  const account = await getVerifiedAccount(request);
  if (!account) return NextResponse.json({ message: 'A verified account is required.' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const className = searchParams.get('className');
  const academicYear = searchParams.get('academicYear') || DEFAULT_ACADEMIC_YEAR;
  const [startYear, endYear] = academicYear.split('-').map(Number);
  if (!/^\d{4}-\d{4}$/.test(academicYear) || endYear !== startYear + 1) {
    return NextResponse.json({ message: 'Academic year must use consecutive YYYY-YYYY values.' }, { status: 400 });
  }

  if (className) {
    if (account.role === 'student' && account.className !== className) {
      return NextResponse.json({ message: 'You can only view subjects for your assigned class.' }, { status: 403 });
    }
    if ((account.role === 'teacher' || account.role === 'prof') && account.className !== className) {
      return NextResponse.json({ message: 'You can only view subjects for your assigned class.' }, { status: 403 });
    }
    const result = await listClassSubjects(className, academicYear);
    return NextResponse.json(result);
  }

  if (account.role !== 'admin') {
    return NextResponse.json({ message: 'Administrator access is required.' }, { status: 403 });
  }
  const subjects = await listAcademicSubjects({
    diplomaId: searchParams.get('diplomaId'),
    sectionId: searchParams.get('sectionId'),
    academicYear: searchParams.get('academicYear'),
    studyYear: searchParams.get('studyYear'),
    semester: searchParams.get('semester'),
    search: searchParams.get('search'),
  });
  return NextResponse.json({ subjects });
}

function mutationError(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  const message = error instanceof Error ? error.message : 'Unable to save the subject.';
  if (code === 'ER_DUP_ENTRY') {
    return NextResponse.json({ message: 'This subject already exists for the selected section, academic year and semester.' }, { status: 409 });
  }
  if (['ER_NO_REFERENCED_ROW_2', 'ER_ROW_IS_REFERENCED_2'].includes(code)) {
    return NextResponse.json({ message: 'The selected academic relationship is no longer valid.' }, { status: 400 });
  }
  if (code === 'ER_DATA_TOO_LONG' || code === 'ER_TRUNCATED_WRONG_VALUE') {
    return NextResponse.json({ message: 'One or more subject fields have an invalid value.' }, { status: 400 });
  }
  if (message.startsWith('Complete') || message.startsWith('Choose') || message.startsWith('The class') || message.startsWith('This subject')) {
    return NextResponse.json({ message }, { status: 400 });
  }
  return NextResponse.json({ message: 'Unable to save the subject.' }, { status: 500 });
}

export async function POST(request: Request) {
  if (!await isAdministrator(request)) return NextResponse.json({ message: 'Administrator access is required.' }, { status: 403 });
  try {
    const subject = await saveAcademicSubject(await request.json());
    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    return mutationError(error);
  }
}

export async function PUT(request: Request) {
  if (!await isAdministrator(request)) return NextResponse.json({ message: 'Administrator access is required.' }, { status: 403 });
  try {
    const body = await request.json();
    const id = body.id ? String(body.id) : '';
    if (!id) return NextResponse.json({ message: 'Subject id is required.' }, { status: 400 });
    const subject = await saveAcademicSubject(body, id);
    if (!subject) return NextResponse.json({ message: 'Subject not found.' }, { status: 404 });
    return NextResponse.json({ subject });
  } catch (error) {
    return mutationError(error);
  }
}

export async function DELETE(request: Request) {
  if (!await isAdministrator(request)) return NextResponse.json({ message: 'Administrator access is required.' }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  if (!/^\d+$/.test(id)) return NextResponse.json({ message: 'Subject id is required.' }, { status: 400 });
  try {
    const deleted = await deleteAcademicSubject(id);
    if (!deleted) return NextResponse.json({ message: 'Subject not found.' }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ message: 'Unable to delete the subject.' }, { status: 500 });
  }
}
