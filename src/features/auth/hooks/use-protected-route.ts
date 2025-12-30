'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTypink } from 'typink';

export function useProtectedRoute() {
  const router = useRouter();
  const { accounts, connectedAccount } = useTypink();
  const [isChecking, setIsChecking] = useState(true);

  const isWalletConnected = accounts.length > 0 && connectedAccount !== null;

  useEffect(() => {
    // Dar un pequeño delay para permitir que typink se inicialice
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Si no hay wallet conectada, redirigir a la landing page
    if (!isChecking && !isWalletConnected) {
      router.replace('/');
    }
  }, [isChecking, isWalletConnected, router]);

  return {
    isChecking,
    isWalletConnected,
  };
}

