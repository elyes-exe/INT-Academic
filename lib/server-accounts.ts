import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { randomBytes, randomUUID } from 'crypto';
import type { RowDataPacket } from 'mysql2';
import { Account, AccountRole, AccountStatus } from '@/lib/auth-types';
import { recordActivity } from '@/lib/dashboard-data';
import { ensureMysqlSchema, getMysqlPool, isoDate, mysqlDate } from '@/lib/server-mysql';

type CreateAccountResult =
  | { success: true; account: Account }
  | { success: false; message: string };

type SignInResult =
  | { success: true; account: Account }
  | { success: false; message: string };

type AccountRow = RowDataPacket & {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  password: string;
  role: AccountRole;
  class_name: string | null;
  status: AccountStatus;
  created_at: Date | string;
  verified_at: Date | string | null;
};

const dataDir = path.join(process.cwd(), 'data');
const accountsFile = path.join(dataDir, 'accounts.json');

const demoAdmin: Required<Account> = {
  id: 'demo-admin',
  fullName: 'INT Administrator',
  email: 'admin@int.edu',
  phone: '',
  password: 'admin123',
  role: 'admin',
  className: '',
  status: 'verified',
  createdAt: '2024-01-01T00:00:00.000Z',
  verifiedAt: '2024-01-01T00:00:00.000Z',
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function sanitizeAccount(account: Account): Account {
  const { password: _password, ...safeAccount } = account;
  return safeAccount;
}

function sanitizeAccounts(accounts: Account[]) {
  return accounts.map(sanitizeAccount);
}

function accountFromRow(row: AccountRow): Account {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? undefined,
    password: row.password,
    role: row.role,
    className: row.class_name ?? undefined,
    status: row.status,
    createdAt: isoDate(row.created_at) ?? new Date().toISOString(),
    verifiedAt: isoDate(row.verified_at),
  };
}

async function ensureFileAccounts() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(accountsFile, 'utf8');
  } catch {
    await writeFile(accountsFile, JSON.stringify([demoAdmin], null, 2));
  }
}

async function readFileAccounts(): Promise<Account[]> {
  await ensureFileAccounts();

  try {
    const rawAccounts = await readFile(accountsFile, 'utf8');
    return JSON.parse(rawAccounts) as Account[];
  } catch {
    return [];
  }
}

async function ensureAdminAccount() {
  await ensureMysqlSchema();

  const pool = getMysqlPool();
  await pool.execute(
    `
      INSERT INTO accounts (id, full_name, email, password, role, status, created_at, verified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id = id
    `,
    [
      demoAdmin.id,
      demoAdmin.fullName,
      demoAdmin.email,
      demoAdmin.password,
      demoAdmin.role,
      demoAdmin.status,
      mysqlDate(demoAdmin.createdAt),
      mysqlDate(demoAdmin.verifiedAt),
    ],
  );
}

async function seedFromFileAccounts() {
  const fileAccounts = await readFileAccounts();

  for (const account of fileAccounts) {
    if (!account.email || !account.password) {
      continue;
    }

    await saveAccount(account, false);
  }
}

async function ensureDatabaseReady() {
  await ensureAdminAccount();
  await seedFromFileAccounts();
}

async function saveAccount(account: Account, overwrite = true) {
  const pool = getMysqlPool();
  const sql = overwrite
    ? `
        INSERT INTO accounts (id, full_name, email, phone, password, role, class_name, status, created_at, verified_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          full_name = VALUES(full_name),
          phone = VALUES(phone),
          password = VALUES(password),
          role = VALUES(role),
          class_name = VALUES(class_name),
          status = VALUES(status),
          created_at = VALUES(created_at),
          verified_at = VALUES(verified_at)
      `
    : `
        INSERT IGNORE INTO accounts (id, full_name, email, phone, password, role, class_name, status, created_at, verified_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

  await pool.execute(sql, [
    account.id,
    account.fullName,
    normalizeEmail(account.email),
    account.phone?.trim() || null,
    account.password ?? '',
    account.role,
    account.className ?? null,
    account.status,
    mysqlDate(account.createdAt),
    mysqlDate(account.verifiedAt),
  ]);
}

async function findStoredAccountByEmail(emailInput: string) {
  await ensureDatabaseReady();

  const [rows] = await getMysqlPool().execute<AccountRow[]>(
    'SELECT * FROM accounts WHERE email = ? LIMIT 1',
    [normalizeEmail(emailInput)],
  );

  return rows[0] ? accountFromRow(rows[0]) : null;
}

export async function getAccounts() {
  await ensureDatabaseReady();

  const [rows] = await getMysqlPool().query<AccountRow[]>(
    'SELECT * FROM accounts ORDER BY created_at DESC',
  );

  return sanitizeAccounts(rows.map(accountFromRow));
}

export async function getAccountById(accountId: string) {
  await ensureDatabaseReady();

  const [rows] = await getMysqlPool().execute<AccountRow[]>(
    'SELECT * FROM accounts WHERE id = ? LIMIT 1',
    [accountId],
  );
  const account = rows[0] ? accountFromRow(rows[0]) : null;

  return account ? sanitizeAccount(account) : null;
}

export async function findAccountByEmail(emailInput: string) {
  const account = await findStoredAccountByEmail(emailInput);
  return account ? sanitizeAccount(account) : null;
}

export async function getOrCreateGoogleAccount(input: { email: string; fullName?: string }) {
  const email = normalizeEmail(input.email);
  const existingAccount = await findStoredAccountByEmail(email);

  if (existingAccount) {
    return sanitizeAccount(existingAccount);
  }

  const account: Account = {
    id: `google-${randomUUID()}`,
    fullName: input.fullName?.trim() || email.split('@')[0],
    email,
    password: randomBytes(32).toString('hex'),
    role: 'student',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await saveAccount(account, false);

  // Re-read after INSERT IGNORE so concurrent callbacks return the same account.
  const savedAccount = await findStoredAccountByEmail(email);
  return sanitizeAccount(savedAccount ?? account);
}

export async function createStudentAccount(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<CreateAccountResult> {
  await ensureDatabaseReady();

  const email = normalizeEmail(input.email);
  const existingAccount = await findStoredAccountByEmail(email);

  if (existingAccount) {
    return { success: false, message: 'An account with this email already exists.' };
  }

  const account: Account = {
    id: `account-${Date.now()}`,
    fullName: input.fullName.trim(),
    email,
    password: input.password,
    role: 'student',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await saveAccount(account);
  await recordActivity('created', 'Student account', account.fullName);

  return { success: true, account: sanitizeAccount(account) };
}

export async function signIn(emailInput: string, password: string): Promise<SignInResult> {
  const account = await findStoredAccountByEmail(emailInput);

  if (!account || account.password !== password) {
    return { success: false, message: 'Invalid email or password.' };
  }

  if (account.status === 'pending') {
    return { success: false, message: 'Your account is waiting for admin verification.' };
  }

  if (account.status === 'rejected') {
    return { success: false, message: 'This account was rejected. Please contact the administrator.' };
  }

  return { success: true, account: sanitizeAccount(account) };
}

export async function updateAccount(
  accountId: string,
  changes: Partial<Pick<Account, 'role' | 'status' | 'className'>>,
) {
  await ensureDatabaseReady();

  const existingAccount = await getAccountById(accountId);

  if (!existingAccount) {
    return null;
  }

  const status = changes.status ?? existingAccount.status;
  const verifiedAt =
    status === 'verified' ? existingAccount.verifiedAt ?? new Date().toISOString() : undefined;

  await getMysqlPool().execute(
    `
      UPDATE accounts
      SET role = ?, class_name = ?, status = ?, verified_at = ?
      WHERE id = ?
    `,
    [
      changes.role ?? existingAccount.role,
      changes.className === undefined ? existingAccount.className ?? null : changes.className.trim() || null,
      status,
      mysqlDate(verifiedAt),
      accountId,
    ],
  );

  const role = changes.role ?? existingAccount.role;
  const className = changes.className === undefined
    ? existingAccount.className
    : changes.className.trim() || undefined;

  if (role === 'student' && status === 'verified' && className) {
    const enrollmentDate = existingAccount.createdAt.slice(0, 10);
    await getMysqlPool().execute(
      `
        INSERT INTO students (name, email, class_name, enrollment_date)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name), class_name = VALUES(class_name)
      `,
      [existingAccount.fullName, normalizeEmail(existingAccount.email), className, enrollmentDate],
    );
  }

  await recordActivity(status === 'verified' ? 'verified' : 'updated', 'Account', existingAccount.fullName);

  return getAccountById(accountId);
}

export async function updateAccountProfile(
  accountId: string,
  changes: Partial<Pick<Account, 'fullName' | 'phone'>>,
) {
  await ensureDatabaseReady();

  const existingAccount = await getAccountById(accountId);

  if (!existingAccount) {
    return null;
  }

  const fullName =
    typeof changes.fullName === 'string' && changes.fullName.trim()
      ? changes.fullName.trim()
      : existingAccount.fullName;
  const phone = typeof changes.phone === 'string' ? changes.phone.trim() : existingAccount.phone ?? '';

  await getMysqlPool().execute(
    `
      UPDATE accounts
      SET full_name = ?, phone = ?
      WHERE id = ?
    `,
    [fullName, phone || null, accountId],
  );

  await recordActivity('updated', 'Account profile', fullName);

  return getAccountById(accountId);
}

export async function updateAccountPassword(emailInput: string, password: string) {
  await ensureDatabaseReady();

  const account = await findStoredAccountByEmail(emailInput);

  if (!account) {
    return null;
  }

  await getMysqlPool().execute('UPDATE accounts SET password = ? WHERE email = ?', [
    password,
    normalizeEmail(emailInput),
  ]);

  await recordActivity('updated', 'Account password', account.fullName);

  return getAccountById(account.id);
}

export async function mergeAccounts(accountsToMerge: Account[]) {
  await ensureDatabaseReady();

  for (const account of accountsToMerge) {
    if (!account.email || !account.password) {
      continue;
    }

    const safeRole: AccountRole = ['admin', 'staff', 'prof', 'student'].includes(account.role)
      ? account.role
      : 'student';
    const safeStatus: AccountStatus = ['pending', 'verified', 'rejected'].includes(account.status)
      ? account.status
      : 'pending';

    await saveAccount(
      {
        ...account,
        email: normalizeEmail(account.email),
        role: safeRole,
        status: safeStatus,
        createdAt: account.createdAt || new Date().toISOString(),
      },
      false,
    );
  }

  return getAccounts();
}
