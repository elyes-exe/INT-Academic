'use client';

import { useEffect, useState } from 'react';
import { getCurrentAccount, type AccountRole } from '@/lib/local-auth';

export function useRoleAccess() {
  const [role, setRole] = useState<AccountRole | null>(null);

  useEffect(() => {
    let isMounted = true;

    getCurrentAccount().then((account) => {
      if (isMounted) {
        setRole(account?.role ?? null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    role,
    canManage: role === 'admin' || role === 'staff',
  };
}
