import mysql from 'mysql2/promise';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { academicDiplomas, academicSectionSeeds, initialAcademicYear } from '@/lib/academic-seed-data';

const databaseName = process.env.MYSQL_DATABASE || 'int_app';

const baseConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
};

let pool: mysql.Pool | null = null;
let schemaPromise: Promise<void> | null = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...baseConfig,
      database: databaseName,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }

  return pool;
}

async function initializeMysqlSchema() {
  const connection = await mysql.createConnection(baseConfig);

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.end();

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id VARCHAR(64) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(50) NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'staff', 'prof', 'teacher', 'student') NOT NULL DEFAULT 'student',
      class_name VARCHAR(150) NULL,
      status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
      created_at DATETIME NOT NULL,
      verified_at DATETIME NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [phoneColumns] = await getPool().query<RowDataPacket[]>(
    "SHOW COLUMNS FROM accounts LIKE 'phone'",
  );

  if (phoneColumns.length === 0) {
    await getPool().query('ALTER TABLE accounts ADD COLUMN phone VARCHAR(50) NULL AFTER email');
  }

  const [roleColumns] = await getPool().query<RowDataPacket[]>(
    "SHOW COLUMNS FROM accounts LIKE 'role'",
  );

  const roleType = String(roleColumns[0]?.Type ?? '');
  if (!roleType.includes("'prof'") || !roleType.includes("'teacher'")) {
    await getPool().query(
      "ALTER TABLE accounts MODIFY COLUMN role ENUM('admin', 'staff', 'prof', 'teacher', 'student') NOT NULL DEFAULT 'student'",
    );
  }

  const [accountClassColumns] = await getPool().query<RowDataPacket[]>(
    "SHOW COLUMNS FROM accounts LIKE 'class_name'",
  );

  if (accountClassColumns.length === 0) {
    await getPool().query('ALTER TABLE accounts ADD COLUMN class_name VARCHAR(150) NULL AFTER role');
  }

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS students (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      class_name VARCHAR(100) NOT NULL,
      enrollment_date DATE NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS staff_members (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      position VARCHAR(255) NOT NULL,
      department VARCHAR(255) NOT NULL,
      join_date DATE NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS classrooms (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      floor VARCHAR(100) NOT NULL,
      capacity INT NOT NULL DEFAULT 0,
      class_size INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS exams (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Planned',
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      classes_count INT NOT NULL DEFAULT 0,
      class_name VARCHAR(150) NOT NULL DEFAULT 'All sections',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [examClassColumns] = await getPool().query<RowDataPacket[]>(
    "SHOW COLUMNS FROM exams LIKE 'class_name'",
  );

  if (examClassColumns.length === 0) {
    await getPool().query(
      "ALTER TABLE exams ADD COLUMN class_name VARCHAR(150) NOT NULL DEFAULT 'All sections' AFTER classes_count",
    );
  }

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      target VARCHAR(50) NOT NULL DEFAULT 'All',
      priority VARCHAR(50) NOT NULL DEFAULT 'Normal',
      announcement_date DATE NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS timetable_entries (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      class_name VARCHAR(100) NOT NULL,
      day_name VARCHAR(30) NOT NULL,
      time_slot VARCHAR(50) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      teacher VARCHAR(255) NOT NULL,
      classroom VARCHAR(255) NOT NULL,
      academic_year CHAR(9) NOT NULL DEFAULT '2026-2027',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_schedule_slot (class_name, day_name, time_slot)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS institution_settings (
      id TINYINT PRIMARY KEY,
      institute_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(100) NOT NULL,
      address VARCHAR(255) NOT NULL,
      notifications BOOLEAN NOT NULL DEFAULT TRUE,
      email_alerts BOOLEAN NOT NULL DEFAULT TRUE,
      two_factor BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      action VARCHAR(50) NOT NULL,
      resource VARCHAR(100) NOT NULL,
      item_label VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_activity_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS app_migrations (
      name VARCHAR(100) PRIMARY KEY,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await getPool().execute(
    "INSERT IGNORE INTO app_migrations (name) VALUES ('academic_catalogue_2026_2027_v1')",
  );

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS academic_diplomas (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      code VARCHAR(12) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS academic_sections (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      diploma_id BIGINT NOT NULL,
      code VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      class_program VARCHAR(255) NOT NULL,
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      UNIQUE KEY uq_academic_section_code (diploma_id, code),
      CONSTRAINT fk_academic_sections_diploma FOREIGN KEY (diploma_id)
        REFERENCES academic_diplomas(id) ON UPDATE CASCADE ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS academic_classes (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      section_id BIGINT NOT NULL,
      name VARCHAR(255) NOT NULL,
      academic_year CHAR(9) NOT NULL,
      study_year TINYINT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      UNIQUE KEY uq_academic_class_year (section_id, academic_year, study_year),
      UNIQUE KEY uq_academic_class_name_year (name, academic_year),
      CONSTRAINT fk_academic_classes_section FOREIGN KEY (section_id)
        REFERENCES academic_sections(id) ON UPDATE CASCADE ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS academic_subjects (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      section_id BIGINT NOT NULL,
      class_id BIGINT NULL,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'Programme',
      description TEXT NULL,
      coefficient DECIMAL(6,2) NULL,
      weekly_hours DECIMAL(5,2) NULL,
      academic_year CHAR(9) NOT NULL,
      study_year TINYINT UNSIGNED NOT NULL DEFAULT 0,
      semester VARCHAR(30) NOT NULL DEFAULT 'Annual',
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      teacher_id VARCHAR(64) NULL,
      UNIQUE KEY uq_academic_subject (section_id, academic_year, semester, study_year, name),
      KEY idx_academic_subject_class (class_id, status),
      CONSTRAINT fk_academic_subjects_section FOREIGN KEY (section_id)
        REFERENCES academic_sections(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      CONSTRAINT fk_academic_subjects_class FOREIGN KEY (class_id)
        REFERENCES academic_classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
      CONSTRAINT fk_academic_subjects_teacher FOREIGN KEY (teacher_id)
        REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [accountClassIdColumns] = await getPool().query<RowDataPacket[]>(
    "SHOW COLUMNS FROM accounts LIKE 'class_id'",
  );
  if (accountClassIdColumns.length === 0) {
    await getPool().query('ALTER TABLE accounts ADD COLUMN class_id BIGINT NULL AFTER class_name');
  }

  await addForeignKeyIfMissing('accounts', 'fk_accounts_academic_class',
    'FOREIGN KEY (class_id) REFERENCES academic_classes(id) ON UPDATE CASCADE ON DELETE SET NULL');

  const timetableColumns: Array<[string, string]> = [
    ['class_id', 'BIGINT NULL'],
    ['subject_id', 'BIGINT NULL'],
    ['teacher_id', 'VARCHAR(64) NULL'],
    ['classroom_id', 'BIGINT NULL'],
    ['academic_year', "CHAR(9) NOT NULL DEFAULT '2026-2027'"],
  ];
  for (const [column, definition] of timetableColumns) {
    const [columns] = await getMysqlPool().query<RowDataPacket[]>(`SHOW COLUMNS FROM timetable_entries LIKE '${column}'`);
    if (columns.length === 0) {
      await getMysqlPool().query(`ALTER TABLE timetable_entries ADD COLUMN ${column} ${definition}`);
    }
  }

  await addForeignKeyIfMissing('timetable_entries', 'fk_timetable_academic_class',
    'FOREIGN KEY (class_id) REFERENCES academic_classes(id) ON UPDATE CASCADE ON DELETE RESTRICT');
  await addForeignKeyIfMissing('timetable_entries', 'fk_timetable_academic_subject',
    'FOREIGN KEY (subject_id) REFERENCES academic_subjects(id) ON UPDATE CASCADE ON DELETE SET NULL');
  await addForeignKeyIfMissing('timetable_entries', 'fk_timetable_teacher',
    'FOREIGN KEY (teacher_id) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE SET NULL');
  await addForeignKeyIfMissing('timetable_entries', 'fk_timetable_classroom',
    'FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON UPDATE CASCADE ON DELETE SET NULL');

  const [academicSeedMarker] = await getMysqlPool().execute<RowDataPacket[]>(
    "SELECT name FROM app_migrations WHERE name = 'academic_subjects_2026_2027_seed_v1' LIMIT 1",
  );
  const [existingSeedRows] = await getMysqlPool().execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS subject_count FROM academic_subjects WHERE academic_year = ?',
    [initialAcademicYear],
  );
  const seedInitialSubjects = academicSeedMarker.length === 0 && Number(existingSeedRows[0]?.subject_count ?? 0) === 0;
  await seedAcademicYear(initialAcademicYear, seedInitialSubjects);
  await getMysqlPool().execute(
    "INSERT IGNORE INTO app_migrations (name) VALUES ('academic_subjects_2026_2027_seed_v1')",
  );
  await syncAccountAcademicClasses();
  await syncTimetableAcademicReferences();

  const [scheduleIndexes] = await getMysqlPool().query<RowDataPacket[]>(
    "SHOW INDEX FROM timetable_entries WHERE Key_name IN ('unique_schedule_slot', 'unique_schedule_class_slot')",
  );
  const indexNames = new Set(scheduleIndexes.map((row) => String(row.Key_name)));
  if (indexNames.has('unique_schedule_slot')) {
    await getMysqlPool().query('ALTER TABLE timetable_entries DROP INDEX unique_schedule_slot');
  }
  if (!indexNames.has('unique_schedule_class_slot')) {
    await getMysqlPool().query(
      'ALTER TABLE timetable_entries ADD UNIQUE KEY unique_schedule_class_slot (class_id, class_name, academic_year, day_name, time_slot)',
    );
  }

  await getPool().execute(
    `
      INSERT INTO institution_settings
        (id, institute_name, email, phone, address, notifications, email_alerts, two_factor)
      VALUES
        (1, 'INT App', '', '', '', TRUE, TRUE, FALSE)
      ON DUPLICATE KEY UPDATE id = id
    `,
  );

  const migrationConnection = await getPool().getConnection();
  try {
    await migrationConnection.beginTransaction();
    const [migration] = await migrationConnection.execute<ResultSetHeader>(
      "INSERT IGNORE INTO app_migrations (name) VALUES ('remove_seeded_demo_data_v1')",
    );

    if (migration.affectedRows > 0) {
      await migrationConnection.execute(
        `DELETE FROM accounts
         WHERE id IN ('demo-admin', 'demo-staff-account', 'demo-student-account')
            OR (email = 'admin@int.edu' AND password = 'admin123')
            OR email IN ('staff.demo@int.edu', 'student.demo@int.edu', 'nadia.staff.demo@int.edu')`,
      );
      await migrationConnection.execute(
        "DELETE FROM students WHERE name LIKE '%demo%' OR email LIKE '%demo%' OR class_name LIKE '%demo%'",
      );
      await migrationConnection.execute(
        "DELETE FROM staff_members WHERE name LIKE '%demo%' OR email LIKE '%demo%' OR position LIKE '%demo%' OR department LIKE '%demo%'",
      );
      await migrationConnection.execute(
        "DELETE FROM classrooms WHERE name LIKE '%demo%'",
      );
      await migrationConnection.execute(
        "DELETE FROM exams WHERE name LIKE '%demo%' OR class_name LIKE '%demo%'",
      );
      await migrationConnection.execute(
        "DELETE FROM announcements WHERE title LIKE '%demo%' OR content LIKE '%demo%' OR content LIKE '%sample%'",
      );
      await migrationConnection.execute(
        "DELETE FROM timetable_entries WHERE class_name LIKE '%demo%' OR subject LIKE '%demo%' OR teacher LIKE '%demo%' OR classroom LIKE '%demo%'",
      );
      await migrationConnection.execute(
        "DELETE FROM activity_logs WHERE item_label LIKE '%demo%' OR item_label LIKE '%sample%'",
      );
      await migrationConnection.execute(
        `UPDATE institution_settings
         SET institute_name = 'INT App', email = '', phone = '', address = ''
         WHERE id = 1 AND email = 'admin@int.edu'
           AND phone = '+1 (555) 123-4567' AND address = '123 Education Street, City'`,
      );
    }

    await migrationConnection.commit();
  } catch (error) {
    await migrationConnection.rollback();
    throw error;
  } finally {
    migrationConnection.release();
  }
}

async function addForeignKeyIfMissing(table: string, name: string, definition: string) {
  const [rows] = await getMysqlPool().execute<RowDataPacket[]>(
    'SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = \'FOREIGN KEY\'',
    [databaseName, table, name],
  );
  if (rows.length === 0) {
    await getMysqlPool().query(`ALTER TABLE ${table} ADD CONSTRAINT ${name} ${definition}`);
  }
}

async function seedAcademicYear(academicYear: string, seedSubjects = false) {
  const pool = getMysqlPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const diploma of academicDiplomas) {
      await connection.execute('INSERT IGNORE INTO academic_diplomas (code, name) VALUES (?, ?)', [diploma.code, diploma.name]);
    }
    for (const section of academicSectionSeeds) {
      const [diplomas] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM academic_diplomas WHERE code = ? LIMIT 1', [section.diplomaCode],
      );
      const diplomaId = Number(diplomas[0]?.id);
      await connection.execute(
        `INSERT INTO academic_sections (diploma_id, code, name, class_program, status)
         VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), class_program = VALUES(class_program), status = VALUES(status)`,
        [diplomaId, section.code, section.name, section.classProgram, section.active ? 'active' : 'inactive'],
      );
      const [sections] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM academic_sections WHERE diploma_id = ? AND code = ? LIMIT 1', [diplomaId, section.code],
      );
      const sectionId = Number(sections[0]?.id);
      for (const studyYear of section.studyYears) {
        const name = studyYear === 0
          ? `${section.diplomaCode} ${section.classProgram}`
          : `${section.diplomaCode} ${section.classProgram} - ${studyYear === 1 ? '1ère' : '2ème'} année`;
        await connection.execute(
          `INSERT INTO academic_classes (section_id, name, academic_year, study_year, status)
           VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), status = VALUES(status)`,
          [sectionId, name, academicYear, studyYear, section.active ? 'active' : 'inactive'],
        );
      }
      for (const group of seedSubjects ? section.subjectGroups : []) {
        for (const subject of group.subjects) {
          await connection.execute(
            `INSERT IGNORE INTO academic_subjects
              (section_id, name, category, academic_year, study_year, semester, status)
             VALUES (?, ?, ?, ?, 0, 'Annual', 'active')`,
            [sectionId, subject, group.category, academicYear],
          );
        }
      }
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function syncAccountAcademicClasses() {
  await getMysqlPool().execute(
    `UPDATE accounts a
     LEFT JOIN academic_classes c ON c.name = a.class_name AND c.academic_year = ?
     SET a.class_id = c.id
     WHERE a.class_name IS NOT NULL AND a.class_name <> ''`,
    [initialAcademicYear],
  );
}

async function syncTimetableAcademicReferences() {
  await getMysqlPool().execute(
    `UPDATE timetable_entries t
     LEFT JOIN academic_classes c ON c.name = t.class_name AND c.academic_year = ?
     SET t.class_id = c.id
     WHERE t.class_id IS NULL`,
    [initialAcademicYear],
  );
  await getMysqlPool().execute(
    `UPDATE timetable_entries t
     JOIN academic_classes c ON c.id = t.class_id
     JOIN academic_sections s ON s.id = c.section_id
     JOIN academic_subjects sub ON sub.section_id = s.id
       AND sub.academic_year = c.academic_year
       AND (sub.study_year = 0 OR sub.study_year = c.study_year)
       AND (sub.class_id IS NULL OR sub.class_id = c.id)
       AND sub.name = t.subject
     SET t.subject_id = sub.id
     WHERE t.subject_id IS NULL`,
  );
  await getMysqlPool().execute(
    `UPDATE timetable_entries t
     JOIN accounts a ON a.full_name = TRIM(SUBSTRING_INDEX(t.teacher, ' - ', 1))
       AND a.role IN ('teacher', 'prof')
     SET t.teacher_id = a.id
     WHERE t.teacher_id IS NULL`,
  );
  await getMysqlPool().execute(
    `UPDATE timetable_entries t JOIN classrooms c ON c.name = t.classroom
     SET t.classroom_id = c.id WHERE t.classroom_id IS NULL`,
  );
}

export async function ensureAcademicYear(academicYear: string) {
  const [startYear, endYear] = academicYear.split('-').map(Number);
  if (!/^\d{4}-\d{4}$/.test(academicYear) || endYear !== startYear + 1) {
    throw new Error('Academic year must use consecutive YYYY-YYYY values.');
  }
  await seedAcademicYear(academicYear, false);
  if (academicYear !== initialAcademicYear) {
    const [priorYears] = await getMysqlPool().execute<RowDataPacket[]>(
      'SELECT DISTINCT academic_year FROM academic_subjects WHERE academic_year < ? ORDER BY academic_year DESC LIMIT 1',
      [academicYear],
    );
    const sourceYear = priorYears[0]?.academic_year ? String(priorYears[0].academic_year) : null;
    if (sourceYear) {
      await getMysqlPool().execute(
        `INSERT IGNORE INTO academic_subjects
          (section_id, class_id, name, category, description, coefficient, weekly_hours,
           academic_year, study_year, semester, status, teacher_id)
         SELECT section_id, NULL, name, category, description, coefficient, weekly_hours,
           ?, study_year, semester, status, NULL
         FROM academic_subjects WHERE academic_year = ?`,
        [academicYear, sourceYear],
      );
    }
  }
}

export async function ensureMysqlSchema() {
  if (!schemaPromise) {
    schemaPromise = initializeMysqlSchema().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

export function getMysqlPool() {
  return getPool();
}

export function mysqlDate(date: string | undefined) {
  if (!date) {
    return null;
  }

  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

export function isoDate(value: unknown) {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}
