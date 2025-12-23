'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TypinkIntro } from '@/components/shared/typink-intro';
import { useTypink } from 'typink';
import { useAuthStore } from '@/store/authStore';
import { useSyncWalletState } from '@/hooks/use-sync-wallet-state';
import type { UserRole } from '@/store/authStore';

function DashboardContent() {
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

  if (accounts.length === 0) {
    return (
      <div className='py-16 text-center text-muted-foreground'>
        Preparing your dashboard...
      </div>
    );
  }

  // Mostrar dashboard normal
  return (
    <div>
      <TypinkIntro />
      {userRole && (
        <div className='mt-4 text-center text-sm text-muted-foreground'>
          Role: <span className='font-semibold capitalize'>{userRole}</span>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className='py-16 text-center text-muted-foreground'>
        Loading dashboard...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
