import mysql from 'mysql2/promise';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

const databaseName = process.env.MYSQL_DATABASE || 'int_app';

const baseConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
};

let pool: mysql.Pool | null = null;

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

export async function ensureMysqlSchema() {
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
      role ENUM('admin', 'staff', 'prof', 'student') NOT NULL DEFAULT 'student',
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

  if (!String(roleColumns[0]?.Type ?? '').includes("'prof'")) {
    await getPool().query(
      "ALTER TABLE accounts MODIFY COLUMN role ENUM('admin', 'staff', 'prof', 'student') NOT NULL DEFAULT 'student'",
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
