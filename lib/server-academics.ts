import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { ensureAcademicYear, ensureMysqlSchema, getMysqlPool } from '@/lib/server-mysql';

export const DEFAULT_ACADEMIC_YEAR = '2026-2027';

type SubjectInput = {
  id?: number | string;
  name?: unknown;
  diplomaId?: unknown;
  sectionId?: unknown;
  classId?: unknown;
  academicYear?: unknown;
  studyYear?: unknown;
  semester?: unknown;
  category?: unknown;
  description?: unknown;
  coefficient?: unknown;
  weeklyHours?: unknown;
  teacherId?: unknown;
  status?: unknown;
};

function numberId(value: unknown) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function optionalNumber(value: unknown, max: number) {
  if (value === '' || value === undefined || value === null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > max) return undefined;
  return parsed;
}

function cleanYear(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{4}$/.test(value)) return null;
  const [first, second] = value.split('-').map(Number);
  return second === first + 1 ? value : null;
}

function mapSubject(row: RowDataPacket) {
  return {
    id: Number(row.id),
    name: String(row.name),
    category: String(row.category),
    description: row.description ? String(row.description) : '',
    diplomaId: Number(row.diploma_id),
    diplomaCode: String(row.diploma_code),
    diplomaName: String(row.diploma_name),
    sectionId: Number(row.section_id),
    sectionName: String(row.section_name),
    sectionCode: String(row.section_code),
    classId: row.class_id === null ? null : Number(row.class_id),
    className: row.class_name ? String(row.class_name) : '',
    academicYear: String(row.academic_year),
    studyYear: Number(row.study_year),
    semester: String(row.semester),
    coefficient: row.coefficient === null ? null : Number(row.coefficient),
    weeklyHours: row.weekly_hours === null ? null : Number(row.weekly_hours),
    teacherId: row.teacher_id ? String(row.teacher_id) : '',
    teacherName: row.teacher_name ? String(row.teacher_name) : '',
    status: String(row.status),
  };
}

const subjectSelect = `
  SELECT sub.*, d.id AS diploma_id, d.code AS diploma_code, d.name AS diploma_name,
    s.name AS section_name, s.code AS section_code, c.name AS class_name,
    a.full_name AS teacher_name
  FROM academic_subjects sub
  JOIN academic_sections s ON s.id = sub.section_id
  JOIN academic_diplomas d ON d.id = s.diploma_id
  LEFT JOIN academic_classes c ON c.id = sub.class_id
  LEFT JOIN accounts a ON a.id = sub.teacher_id
`;

export async function getAcademicCatalogue(academicYear = DEFAULT_ACADEMIC_YEAR) {
  await ensureMysqlSchema();
  await ensureAcademicYear(academicYear);
  const [diplomas] = await getMysqlPool().query<RowDataPacket[]>(
    'SELECT id, code, name FROM academic_diplomas ORDER BY code',
  );
  const [sections] = await getMysqlPool().query<RowDataPacket[]>(
    `SELECT s.id, s.diploma_id AS diplomaId, d.code AS diplomaCode, s.code, s.name,
       s.class_program AS classProgram, s.status
     FROM academic_sections s JOIN academic_diplomas d ON d.id = s.diploma_id
     ORDER BY d.code, s.name`,
  );
  const [classes] = await getMysqlPool().execute<RowDataPacket[]>(
    `SELECT c.id, c.section_id AS sectionId, c.name, c.academic_year AS academicYear,
       c.study_year AS studyYear, c.status, s.name AS sectionName,
       s.class_program AS classProgram, d.code AS diplomaCode
     FROM academic_classes c
     JOIN academic_sections s ON s.id = c.section_id
     JOIN academic_diplomas d ON d.id = s.diploma_id
     WHERE c.academic_year = ? AND c.status = 'active' AND s.status = 'active'
     ORDER BY d.code, s.name, c.study_year`,
    [academicYear],
  );
  const [teachers] = await getMysqlPool().query<RowDataPacket[]>(
    `SELECT id, full_name AS fullName, class_name AS className
     FROM accounts WHERE role IN ('teacher', 'prof') AND status = 'verified'
     ORDER BY full_name`,
  );
  return {
    academicYear,
    diplomas: diplomas.map((row) => ({ id: Number(row.id), code: String(row.code), name: String(row.name) })),
    sections: sections.map((row) => ({ ...row, id: Number(row.id), diplomaId: Number(row.diplomaId) })),
    classes: classes.map((row) => ({ ...row, id: Number(row.id), sectionId: Number(row.sectionId), studyYear: Number(row.studyYear) })),
    teachers: teachers.map((row) => ({ id: String(row.id), fullName: String(row.fullName), className: String(row.className ?? '') })),
  };
}

export async function resolveAcademicClass(className: string, academicYear = DEFAULT_ACADEMIC_YEAR) {
  await ensureMysqlSchema();
  await ensureAcademicYear(academicYear);
  const [rows] = await getMysqlPool().execute<RowDataPacket[]>(
    `SELECT c.id, c.section_id, c.name, c.academic_year, c.study_year,
       s.name AS section_name, s.code AS section_code, s.status AS section_status,
       d.code AS diploma_code
     FROM academic_classes c
     JOIN academic_sections s ON s.id = c.section_id
     JOIN academic_diplomas d ON d.id = s.diploma_id
     WHERE c.name = ? AND c.academic_year = ? AND c.status = 'active' AND s.status = 'active'
     LIMIT 1`,
    [className, academicYear],
  );
  return rows[0] ?? null;
}

export async function listClassSubjects(className: string, academicYear = DEFAULT_ACADEMIC_YEAR) {
  const classRow = await resolveAcademicClass(className, academicYear);
  if (!classRow) return { classInfo: null, subjects: [] };
  const [rows] = await getMysqlPool().execute<RowDataPacket[]>(
    `${subjectSelect}
     WHERE sub.section_id = ? AND sub.academic_year = ?
       AND (sub.study_year = 0 OR sub.study_year = ?)
       AND (sub.class_id IS NULL OR sub.class_id = ?)
       AND sub.status = 'active'
     ORDER BY sub.category, sub.name`,
    [Number(classRow.section_id), academicYear, Number(classRow.study_year), Number(classRow.id)],
  );
  return {
    classInfo: {
      id: Number(classRow.id),
      name: String(classRow.name),
      sectionId: Number(classRow.section_id),
      sectionName: String(classRow.section_name),
      sectionCode: String(classRow.section_code),
      diplomaCode: String(classRow.diploma_code),
      academicYear: String(classRow.academic_year),
      studyYear: Number(classRow.study_year),
    },
    subjects: rows.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      category: String(row.category),
      teacherId: row.teacher_id ? String(row.teacher_id) : '',
      teacherName: row.teacher_name ? String(row.teacher_name) : '',
    })),
  };
}

export async function listAcademicSubjects(filters: {
  diplomaId?: string | null;
  sectionId?: string | null;
  academicYear?: string | null;
  studyYear?: string | null;
  semester?: string | null;
  search?: string | null;
} = {}) {
  await ensureMysqlSchema();
  if (filters.academicYear) await ensureAcademicYear(filters.academicYear);
  const where: string[] = [];
  const values: Array<string | number | null> = [];
  if (filters.diplomaId) { where.push('d.id = ?'); values.push(filters.diplomaId); }
  if (filters.sectionId) { where.push('s.id = ?'); values.push(filters.sectionId); }
  if (filters.academicYear) { where.push('sub.academic_year = ?'); values.push(filters.academicYear); }
  if (filters.studyYear && filters.studyYear !== 'all') { where.push('sub.study_year = ?'); values.push(Number(filters.studyYear)); }
  if (filters.semester && filters.semester !== 'all') { where.push('sub.semester = ?'); values.push(filters.semester); }
  if (filters.search?.trim()) { where.push('(sub.name LIKE ? OR sub.description LIKE ?)'); values.push(`%${filters.search.trim()}%`, `%${filters.search.trim()}%`); }
  const [rows] = await getMysqlPool().execute<RowDataPacket[]>(
    `${subjectSelect}${where.length ? ` WHERE ${where.join(' AND ')}` : ''}
     ORDER BY d.code, s.name, sub.study_year, sub.semester, sub.name`,
    values,
  );
  return rows.map(mapSubject);
}

async function validateSubjectInput(input: SubjectInput) {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const sectionId = numberId(input.sectionId);
  const diplomaId = numberId(input.diplomaId);
  const classId = input.classId === '' || input.classId === null || input.classId === undefined
    ? null : numberId(input.classId);
  const classIdWasProvided = input.classId !== '' && input.classId !== null && input.classId !== undefined;
  const academicYear = cleanYear(input.academicYear);
  const studyYear = input.studyYear === undefined || input.studyYear === null || input.studyYear === ''
    ? (classId ? null : 0) : Number(input.studyYear);
  const semester = typeof input.semester === 'string' ? input.semester.trim() : '';
  const status = input.status === 'inactive' ? 'inactive' : input.status === undefined || input.status === 'active' ? 'active' : null;
  const category = typeof input.category === 'string' && input.category.trim() ? input.category.trim() : 'Programme';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const coefficient = optionalNumber(input.coefficient, 100);
  const weeklyHours = optionalNumber(input.weeklyHours, 80);
  const teacherId = typeof input.teacherId === 'string' && input.teacherId.trim() ? input.teacherId.trim() : null;
  if (!name || name.length > 255 || !sectionId || !diplomaId || !academicYear || !semester ||
      !['Annual', 'Semester 1', 'Semester 2'].includes(semester) || !status ||
      studyYear === null || !Number.isInteger(studyYear) || studyYear < 0 || studyYear > 2 ||
      coefficient === undefined || weeklyHours === undefined || category.length > 100 || description.length > 65000 ||
      (classIdWasProvided && !classId)) {
    throw new Error('Complete the subject fields with valid values.');
  }
  await ensureAcademicYear(academicYear);
  const [sections] = await getMysqlPool().execute<RowDataPacket[]>(
    'SELECT s.id, s.diploma_id, s.status FROM academic_sections s WHERE s.id = ? LIMIT 1', [sectionId],
  );
  if (!sections[0] || Number(sections[0].diploma_id) !== diplomaId || sections[0].status !== 'active') {
    throw new Error('Choose an active section belonging to the selected diploma.');
  }
  if (classId) {
    const [classes] = await getMysqlPool().execute<RowDataPacket[]>(
      `SELECT id, section_id, academic_year, study_year FROM academic_classes
       WHERE id = ? AND status = 'active' LIMIT 1`, [classId],
    );
    if (!classes[0] || Number(classes[0].section_id) !== sectionId ||
        String(classes[0].academic_year) !== academicYear) {
      throw new Error('Choose a class that belongs to the selected section and academic year.');
    }
  }
  if (classId && studyYear !== Number((await getMysqlPool().execute<RowDataPacket[]>(
    'SELECT study_year FROM academic_classes WHERE id = ? LIMIT 1', [classId],
  ))[0][0]?.study_year)) {
    throw new Error('The class and study year do not match.');
  }
  if (teacherId) {
    const [teachers] = await getMysqlPool().execute<RowDataPacket[]>(
      `SELECT a.id, a.class_name, c.section_id, c.academic_year, c.id AS class_id
       FROM accounts a LEFT JOIN academic_classes c ON c.name = a.class_name AND c.academic_year = ?
       WHERE a.id = ? AND a.role IN ('teacher', 'prof') AND a.status = 'verified' LIMIT 1`,
      [academicYear, teacherId],
    );
    if (!teachers[0] || (teachers[0].class_name && !teachers[0].section_id) ||
        (teachers[0].section_id && Number(teachers[0].section_id) !== sectionId) ||
        (classId && teachers[0].class_id && Number(teachers[0].class_id) !== classId)) {
      throw new Error('Choose a verified teacher assigned to this class or section.');
    }
  }
  return {
    sectionId, classId, name, category, description: description || null,
    coefficient, weeklyHours, academicYear, studyYear,
    semester, status, teacherId,
  };
}

export async function saveAcademicSubject(input: SubjectInput, subjectId?: string) {
  await ensureMysqlSchema();
  const values = await validateSubjectInput(input);
  const pool = getMysqlPool();
  if (subjectId) {
    const [references] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) AS scheduled FROM timetable_entries WHERE subject_id = ?', [subjectId],
    );
    const [previousRows] = await pool.execute<RowDataPacket[]>(
      'SELECT section_id, class_id, academic_year, study_year FROM academic_subjects WHERE id = ? LIMIT 1', [subjectId],
    );
    if (!previousRows[0]) return null;
    const previous = previousRows[0];
    const linkChanged = Number(previous.section_id) !== values.sectionId ||
      (previous.class_id === null ? null : Number(previous.class_id)) !== values.classId ||
      String(previous.academic_year) !== values.academicYear || Number(previous.study_year) !== values.studyYear;
    if (Number(references[0]?.scheduled) > 0 && linkChanged) {
      throw new Error('This subject already has timetable sessions. Remove those sessions before changing its class or academic year.');
    }
    await pool.execute(
      `UPDATE academic_subjects SET section_id = ?, class_id = ?, name = ?, category = ?,
         description = ?, coefficient = ?, weekly_hours = ?, academic_year = ?, study_year = ?,
         semester = ?, status = ?, teacher_id = ? WHERE id = ?`,
      [values.sectionId, values.classId, values.name, values.category, values.description,
        values.coefficient, values.weeklyHours, values.academicYear, values.studyYear,
        values.semester, values.status, values.teacherId, subjectId],
    );
    await pool.execute('UPDATE timetable_entries SET subject = ? WHERE subject_id = ?', [values.name, subjectId]);
    if (values.teacherId) {
      const [assignedTeachers] = await pool.execute<RowDataPacket[]>(
        'SELECT full_name, class_name FROM accounts WHERE id = ? LIMIT 1', [values.teacherId],
      );
      if (assignedTeachers[0]) {
        await pool.execute(
          'UPDATE timetable_entries SET teacher_id = ?, teacher = ? WHERE subject_id = ?',
          [values.teacherId, `${assignedTeachers[0].full_name}${assignedTeachers[0].class_name ? ` - ${assignedTeachers[0].class_name}` : ''}`, subjectId],
        );
      }
    } else {
      await pool.execute('UPDATE timetable_entries SET teacher_id = NULL WHERE subject_id = ?', [subjectId]);
    }
    const updated = await listAcademicSubjects({ search: values.name });
    return updated.find((subject) => String(subject.id) === subjectId) ?? null;
  }
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO academic_subjects
      (section_id, class_id, name, category, description, coefficient, weekly_hours,
       academic_year, study_year, semester, status, teacher_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [values.sectionId, values.classId, values.name, values.category, values.description,
      values.coefficient, values.weeklyHours, values.academicYear, values.studyYear,
      values.semester, values.status, values.teacherId],
  );
  const created = await listAcademicSubjects({ search: values.name });
  return created.find((subject) => subject.id === result.insertId) ?? null;
}

export async function deleteAcademicSubject(id: string) {
  await ensureMysqlSchema();
  const [result] = await getMysqlPool().execute<ResultSetHeader>(
    'DELETE FROM academic_subjects WHERE id = ?', [id],
  );
  return result.affectedRows > 0;
}

export async function validateTimetableSelection(input: {
  className: unknown;
  subjectId: unknown;
  teacherId?: unknown;
  academicYear?: unknown;
}) {
  await ensureMysqlSchema();
  const className = typeof input.className === 'string' ? input.className.trim() : '';
  const subjectId = numberId(input.subjectId);
  const academicYear = cleanYear(input.academicYear) ?? DEFAULT_ACADEMIC_YEAR;
  if (!className || !subjectId) throw new Error('Choose a valid class and subject.');
  const classRow = await resolveAcademicClass(className, academicYear);
  if (!classRow) throw new Error('The selected class is not active in this academic year.');
  const [subjects] = await getMysqlPool().execute<RowDataPacket[]>(
    `SELECT sub.id, sub.name, sub.teacher_id FROM academic_subjects sub
     WHERE sub.id = ? AND sub.section_id = ? AND sub.academic_year = ?
       AND (sub.study_year = 0 OR sub.study_year = ?)
       AND (sub.class_id IS NULL OR sub.class_id = ?) AND sub.status = 'active' LIMIT 1`,
    [subjectId, Number(classRow.section_id), academicYear, Number(classRow.study_year), Number(classRow.id)],
  );
  if (!subjects[0]) throw new Error('The selected subject does not belong to this class or is inactive.');
  const teacherId = typeof input.teacherId === 'string' && input.teacherId.trim() ? input.teacherId.trim() : null;
  if (teacherId) {
    const [teachers] = await getMysqlPool().execute<RowDataPacket[]>(
      `SELECT id, class_name FROM accounts WHERE id = ? AND role IN ('teacher', 'prof') AND status = 'verified' LIMIT 1`,
      [teacherId],
    );
    if (!teachers[0]) throw new Error('Choose a verified teacher.');
    const assignedClass = String(teachers[0].class_name ?? '');
    if (assignedClass && assignedClass !== className) throw new Error('The selected teacher is not assigned to this class.');
    if (subjects[0].teacher_id && String(subjects[0].teacher_id) !== teacherId) {
      throw new Error('The selected teacher does not match the subject assignment.');
    }
  } else if (subjects[0].teacher_id) {
    throw new Error('This subject requires its assigned teacher.');
  }
  return { classId: Number(classRow.id), subjectId, subjectName: String(subjects[0].name), teacherId };
}
