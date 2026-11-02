export type AccountRole = 'admin' | 'staff' | 'student';
export type AccountStatus = 'pending' | 'verified' | 'rejected';

export type Account = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  password?: string;
  role: AccountRole;
  status: AccountStatus;
  createdAt: string;
  verifiedAt?: string;
};
