import { NextResponse } from 'next/server';
import { getAcademicCatalogue, resolveAcademicClass, DEFAULT_ACADEMIC_YEAR } from '@/lib/server-academics';
import { getAccountById } from '@/lib/server-accounts';
import { getAuthSessionAccountId } from '@/lib/server-auth-session';

export async function GET(request: Request) {
  const accountId = await getAuthSessionAccountId(request);
  const account = accountId ? await getAccountById(accountId) : null;
  if (!account || account.status !== 'verified') {
    return NextResponse.json({ message: 'A verified account is required.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const academicYear = searchParams.get('academicYear') || DEFAULT_ACADEMIC_YEAR;
  const [startYear, endYear] = academicYear.split('-').map(Number);
  if (!/^\d{4}-\d{4}$/.test(academicYear) || endYear !== startYear + 1) {
    return NextResponse.json({ message: 'Academic year must use consecutive YYYY-YYYY values.' }, { status: 400 });
  }
  const catalogue = await getAcademicCatalogue(academicYear);
  if (account.role === 'student' || account.role === 'teacher' || account.role === 'prof') {
    if (!account.className) {
      return NextResponse.json({ message: 'Your account must be assigned to a class first.' }, { status: 403 });
    }
    const classInfo = await resolveAcademicClass(account.className, academicYear);
    if (!classInfo) return NextResponse.json({ message: 'Your class is not available for this academic year.' }, { status: 403 });
    catalogue.diplomas = catalogue.diplomas.filter((diploma) => diploma.code === String(classInfo.diploma_code));
    catalogue.sections = catalogue.sections.filter((section) => Number(section.id) === Number(classInfo.section_id));
    catalogue.classes = catalogue.classes.filter((academicClass) => Number(academicClass.id) === Number(classInfo.id));
    catalogue.teachers = [];
  }
  return NextResponse.json(catalogue);
}
