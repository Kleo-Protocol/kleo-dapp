'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTypink } from 'typink';
import { useAuthStore } from '@/store/authStore';
import { verifyAndRegisterUser, registerUser } from '@/services/userService';
import { logger } from '@/lib/logger';

export function useUserRoleSelection() {
  const router = useRouter();
  const pathname = usePathname();
  const { connectedAccount } = useTypink();
  const { isRegistered, isCheckingRegistration, setIsRegistered, setUserRole, error } = useAuthStore();
  const [isRegistering, setIsRegistering] = useState(false);

  const address = connectedAccount?.address;
  const hasCheckedRef = useRef<string | undefined>(undefined);

  // Check registration when wallet connects
  useEffect(() => {
    // Only check if there's a new connected wallet (different address) and we're on the home page
    if (address && address !== hasCheckedRef.current && pathname === '/') {
      hasCheckedRef.current = address;

      // Check if user is registered
      if (!isCheckingRegistration) {
        verifyAndRegisterUser(address)
          .then((result) => {
            // If user is already registered and has a role, redirect automatically
            if (result.isRegistered && result.role) {
              setIsRegistered(true);
              setUserRole(result.role);
              const targetPath = result.role === 'lender' ? '/lend' : '/borrow';
              router.replace(targetPath);
            }
          })
          .catch(() => {
            // Error is already handled in the store
          });
      }
    }

    // Reset flag if address changes or disconnects
    if (!address) {
      hasCheckedRef.current = undefined;
    }
  }, [address, isCheckingRegistration, pathname, router, setIsRegistered, setUserRole]);

  const handleRoleSelection = async (role: 'lender' | 'borrower') => {
    if (!address || isRegistering) return;

    try {
      setIsRegistering(true);
      useAuthStore.setState({ error: undefined });

      // Register user with selected role
      await registerUser(address, role);
      setIsRegistered(true);
      setUserRole(role);

      // Navigate to the corresponding page based on role
      const targetPath = role === 'lender' ? '/lend' : '/borrow';
      router.replace(targetPath);
    } catch (error) {
      // Error is already handled in the store
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error registering user', { error: err.message }, err);
    } finally {
      setIsRegistering(false);
    }
  };

  // Modal only shows for first timers (unregistered users)
  // - We're on the home page
  // - Wallet is connected
  // - User is NOT registered
  // - Not checking registration (to avoid flash)
  // - Not in registration process
  const shouldShowModal = Boolean(
    pathname === '/' && address && !isRegistered && !isCheckingRegistration && !isRegistering,
  );

  // Don't show modal if we're not on the home page or if user is already registered
  const shouldRender = pathname === '/' && !isRegistered;

  return {
    shouldShowModal,
    shouldRender,
    isRegistering,
    error,
    handleRoleSelection,
  };
}

