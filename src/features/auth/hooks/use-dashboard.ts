'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSyncWalletState } from '@/features/auth/hooks/use-sync-wallet-state';
import type { UserRole } from '@/store/authStore';

export function useDashboard() {
  const searchParams = useSearchParams();
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

  // No redirigir automáticamente - permitir que el usuario vea el dashboard sin wallet
  // La wallet solo será necesaria para acciones específicas
  const shouldShowContent = true;

  return {
    userRole,
    shouldShowContent,
  };
}

