'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTypink } from 'typink';
import { useAuthStore } from '@/store/authStore';
import { useSyncWalletState } from '@/features/auth/hooks/use-sync-wallet-state';
import type { UserRole } from '@/store/authStore';

export function useDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accounts } = useTypink();
  const { userRole, setUserRole } = useAuthStore();

  // Sincronizar estado de typink con nuestro store
  useSyncWalletState();

  // Leer rol del query param y guardarlo en el store
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'lender' || roleParam === 'borrower') {
      const role = roleParam as UserRole;
      if (role !== userRole) {
        setUserRole(role);
      }
    }
  }, [searchParams, userRole, setUserRole]);

  useEffect(() => {
    if (accounts.length === 0) {
      router.replace('/');
    }
  }, [accounts.length, router]);

  const shouldShowContent = accounts.length > 0;

  return {
    userRole,
    shouldShowContent,
  };
}

