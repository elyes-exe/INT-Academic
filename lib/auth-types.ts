export type AccountRole = 'admin' | 'staff' | 'prof' | 'student';
export type AccountStatus = 'pending' | 'verified' | 'rejected';

export type Account = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  className?: string;
  password?: string;
  role: AccountRole;
  status: AccountStatus;
  createdAt: string;
  verifiedAt?: string;
};
