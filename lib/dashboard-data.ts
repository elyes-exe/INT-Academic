import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { ensureMysqlSchema, getMysqlPool } from '@/lib/server-mysql';
import { validateTimetableSelection } from '@/lib/server-academics';

type ResourceName =
  | 'students'
  | 'staff'
  | 'classrooms'
  | 'exams'
  | 'announcements'
  | 'timetable';

type FieldConfig = Record<string, string>;

type ResourceConfig = {
  table: string;
  fields: FieldConfig;
  orderBy: string;
};

type DashboardValue = string | number | boolean | null;

const resources: Record<ResourceName, ResourceConfig> = {
  students: {
    table: 'students',
    fields: {
      name: 'name',
      email: 'email',
      class: 'class_name',
      enrollment: 'enrollment_date',
    },
    orderBy: 'name ASC',
  },
  staff: {
    table: 'staff_members',
    fields: {
      name: 'name',
      email: 'email',
      position: 'position',
      department: 'department',
      joinDate: 'join_date',
    },
    orderBy: 'name ASC',
  },
  classrooms: {
    table: 'classrooms',
    fields: {
      name: 'name',
      floor: 'floor',
      capacity: 'capacity',
      classSize: 'class_size',
    },
    orderBy: 'name ASC',
  },
  exams: {
    table: 'exams',
    fields: {
      name: 'name',
      status: 'status',
      startDate: 'start_date',
      endDate: 'end_date',
      classes: 'classes_count',
      className: 'class_name',
    },
    orderBy: 'start_date DESC',
  },
  announcements: {
    table: 'announcements',
    fields: {
      title: 'title',
      content: 'content',
      target: 'target',
      priority: 'priority',
      date: 'announcement_date',
    },
    orderBy: 'announcement_date DESC, id DESC',
  },
  timetable: {
    table: 'timetable_entries',
    fields: {
      className: 'class_name',
      classId: 'class_id',
      academicYear: 'academic_year',
      day: 'day_name',
      time: 'time_slot',
      subject: 'subject',
      subjectId: 'subject_id',
      teacher: 'teacher',
      teacherId: 'teacher_id',
      classroom: 'classroom',
      classroomId: 'classroom_id',
    },
    orderBy: 'class_name ASC, day_name ASC, time_slot ASC',
  },
};

const resourceLabels: Record<ResourceName, string> = {
  students: 'Student',
  staff: 'Staff member',
  classrooms: 'Classroom',
  exams: 'Exam',
  announcements: 'Announcement',
  timetable: 'Timetable entry',
};

function formatValue(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value;
}

function normalizeValue(value: unknown): DashboardValue {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value);
}

function rowToItem(row: RowDataPacket, config: ResourceConfig) {
  const item: Record<string, unknown> = { id: row.id };

  for (const [publicKey, dbColumn] of Object.entries(config.fields)) {
    item[publicKey] = formatValue(row[dbColumn]);
  }

  return item;
}

function getResourceConfig(resource: string) {
  if (!(resource in resources)) {
    return null;
  }

  return resources[resource as ResourceName];
}

function payloadValues(config: ResourceConfig, payload: Record<string, unknown>) {
  const entries = Object.entries(config.fields).filter(([publicKey]) => payload[publicKey] !== undefined);
  const columns = entries.map(([, column]) => column);
  const values = entries.map(([publicKey]) => normalizeValue(payload[publicKey]));

  return { entries, columns, values };
}

function itemLabel(item: Record<string, unknown> | null) {
  if (!item) {
    return null;
  }

  const value = item.name ?? item.title ?? item.subject ?? item.email;
  return value ? String(value) : null;
}

function formatActivityDate(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value ? new Date(String(value)).toISOString() : new Date().toISOString();
}

export async function recordActivity(action: string, resource: string, label?: string | null) {
  await ensureMysqlSchema();

  await getMysqlPool().execute(
    'INSERT INTO activity_logs (action, resource, item_label) VALUES (?, ?, ?)',
    [action, resource, label ?? null],
  );
}

export async function listResource(resource: string, studentClass?: string, studentClassId?: number) {
  const config = getResourceConfig(resource);

  if (!config) {
    return null;
  }

  await ensureMysqlSchema();

  const classScopedStudentResources = ['students', 'timetable', 'exams'];
  const [rows] = studentClass !== undefined && resource === 'timetable' && studentClassId
    ? await getMysqlPool().execute<RowDataPacket[]>(
        `SELECT * FROM ${config.table}
         WHERE class_id = ? OR (class_id IS NULL AND class_name = ? AND academic_year =
           (SELECT academic_year FROM academic_classes WHERE id = ?))
         ORDER BY ${config.orderBy}`,
        [studentClassId, studentClass, studentClassId],
      )
    : studentClass !== undefined && classScopedStudentResources.includes(resource)
      ? await getMysqlPool().execute<RowDataPacket[]>(
          `SELECT * FROM ${config.table} WHERE class_name = ? ORDER BY ${config.orderBy}`,
          [studentClass],
        )
      : await getMysqlPool().query<RowDataPacket[]>(
          `SELECT * FROM ${config.table} ORDER BY ${config.orderBy}`,
        );

  return rows.map((row) => rowToItem(row, config));
}

export async function createResource(resource: string, payload: Record<string, unknown>) {
  const config = getResourceConfig(resource);

  if (!config) {
    return null;
  }

  await ensureMysqlSchema();

  if (resource === 'timetable') {
    const linked = await validateTimetableSelection({
      className: payload.className,
      subjectId: payload.subjectId,
      teacherId: payload.teacherId,
      academicYear: payload.academicYear,
    });
    const [classrooms] = await getMysqlPool().execute<RowDataPacket[]>(
      'SELECT id FROM classrooms WHERE name = ? ORDER BY id LIMIT 1', [normalizeValue(payload.classroom)],
    );
    payload = {
      ...payload,
      classId: linked.classId,
      subjectId: linked.subjectId,
      subject: linked.subjectName,
      teacherId: linked.teacherId,
      classroomId: classrooms[0]?.id ?? null,
    };
  }

  const { columns, values } = payloadValues(config, payload);

  if (columns.length === 0) {
    throw new Error('No fields provided.');
  }

  const placeholders = columns.map(() => '?').join(', ');
  const [result] = await getMysqlPool().execute<ResultSetHeader>(
    `INSERT INTO ${config.table} (${columns.join(', ')}) VALUES (${placeholders})`,
    values,
  );

  const item = await getResourceById(config, result.insertId);
  await recordActivity('created', resourceLabels[resource as ResourceName], itemLabel(item));

  return item;
}

async function getResourceById(config: ResourceConfig, id: number | string) {
  const [rows] = await getMysqlPool().execute<RowDataPacket[]>(
    `SELECT * FROM ${config.table} WHERE id = ? LIMIT 1`,
    [id],
  );

  return rows[0] ? rowToItem(rows[0], config) : null;
}

export async function updateResource(resource: string, id: string, payload: Record<string, unknown>) {
  const config = getResourceConfig(resource);

  if (!config) {
    return null;
  }

  await ensureMysqlSchema();

  if (resource === 'timetable') {
    const current = await getResourceById(config, id);
    if (!current) return null;
    const next = { ...current, ...payload };
    const linked = await validateTimetableSelection({
      className: next.className,
      subjectId: next.subjectId,
      teacherId: next.teacherId,
      academicYear: next.academicYear,
    });
    const [classrooms] = await getMysqlPool().execute<RowDataPacket[]>(
      'SELECT id FROM classrooms WHERE name = ? ORDER BY id LIMIT 1', [normalizeValue(next.classroom)],
    );
    payload = {
      ...next,
      classId: linked.classId,
      subjectId: linked.subjectId,
      subject: linked.subjectName,
      teacherId: linked.teacherId,
      classroomId: classrooms[0]?.id ?? null,
    };
  }

  const { entries, values } = payloadValues(config, payload);

  if (entries.length === 0) {
    throw new Error('No fields provided.');
  }

  const assignments = entries.map(([, column]) => `${column} = ?`).join(', ');
  await getMysqlPool().execute(
    `UPDATE ${config.table} SET ${assignments} WHERE id = ?`,
    [...values, id],
  );

  const item = await getResourceById(config, id);
  await recordActivity('updated', resourceLabels[resource as ResourceName], itemLabel(item));

  return item;
}

export async function deleteResource(resource: string, id: string) {
  const config = getResourceConfig(resource);

  if (!config) {
    return null;
  }

  await ensureMysqlSchema();

  const item = await getResourceById(config, id);
  await getMysqlPool().execute(`DELETE FROM ${config.table} WHERE id = ?`, [id]);
  await recordActivity('deleted', resourceLabels[resource as ResourceName], itemLabel(item));

  return true;
}

export async function getSettings() {
  await ensureMysqlSchema();

  const [rows] = await getMysqlPool().query<RowDataPacket[]>(
    'SELECT * FROM institution_settings WHERE id = 1 LIMIT 1',
  );
  const settings = rows[0];

  if (!settings) {
    return null;
  }

  return {
    instituteName: settings.institute_name,
    email: settings.email,
    phone: settings.phone,
    address: settings.address,
    notifications: Boolean(settings.notifications),
    emailAlerts: Boolean(settings.email_alerts),
    twoFactor: Boolean(settings.two_factor),
  };
}

export async function updateSettings(payload: Record<string, unknown>) {
  await ensureMysqlSchema();

  await getMysqlPool().execute(
    `
      UPDATE institution_settings
      SET institute_name = ?, email = ?, phone = ?, address = ?,
          notifications = ?, email_alerts = ?, two_factor = ?
      WHERE id = 1
    `,
    [
      normalizeValue(payload.instituteName),
      normalizeValue(payload.email),
      normalizeValue(payload.phone),
      normalizeValue(payload.address),
      Boolean(payload.notifications),
      Boolean(payload.emailAlerts),
      Boolean(payload.twoFactor),
    ],
  );

  await recordActivity('updated', 'Institution settings', 'System preferences');

  return getSettings();
}

export async function getDashboardSummary() {
  await ensureMysqlSchema();

  const [countRows] = await getMysqlPool().query<RowDataPacket[]>(`
    SELECT
      (SELECT COUNT(*) FROM students) AS students,
      (SELECT COUNT(*) FROM staff_members) AS staff,
      (SELECT COUNT(*) FROM classrooms) AS classrooms,
      (SELECT COUNT(*) FROM exams) AS exams,
      (SELECT COUNT(*) FROM announcements) AS announcements,
      (SELECT COUNT(*) FROM timetable_entries) AS timetable,
      (SELECT COUNT(*) FROM accounts) AS accounts,
      (SELECT COUNT(*) FROM accounts WHERE status = 'pending') AS pendingAccounts
  `);

  const [announcementRows] = await getMysqlPool().query<RowDataPacket[]>(
    'SELECT * FROM announcements ORDER BY announcement_date DESC, id DESC LIMIT 3',
  );

  const [activityRows] = await getMysqlPool().query<RowDataPacket[]>(
    'SELECT action, resource, item_label, created_at FROM activity_logs ORDER BY created_at DESC, id DESC LIMIT 5',
  );

  const counts = countRows[0] ?? {};

  return {
    counts: {
      students: Number(counts.students ?? 0),
      staff: Number(counts.staff ?? 0),
      classrooms: Number(counts.classrooms ?? 0),
      exams: Number(counts.exams ?? 0),
      announcements: Number(counts.announcements ?? 0),
      timetable: Number(counts.timetable ?? 0),
      accounts: Number(counts.accounts ?? 0),
      pendingAccounts: Number(counts.pendingAccounts ?? 0),
    },
    latestAnnouncements: announcementRows.map((row) => rowToItem(row, resources.announcements)),
    recentActivity: activityRows.map((row) => ({
      action: row.action,
      resource: row.resource,
      itemLabel: row.item_label,
      createdAt: formatActivityDate(row.created_at),
    })),
  };
}
