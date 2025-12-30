'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTypink } from 'typink';
import { useAuthStore } from '@/store/authStore';
import { verifyAndRegisterUser, registerUser } from '@/services/userService';

export function useUserRoleSelection() {
  const router = useRouter();
  const pathname = usePathname();
  const { connectedAccount } = useTypink();
  const { isRegistered, isCheckingRegistration, setIsRegistered, setUserRole, error } = useAuthStore();
  const [isRegistering, setIsRegistering] = useState(false);

  const address = connectedAccount?.address;
  const hasCheckedRef = useRef<string | undefined>(undefined);

  // Verificar registro cuando se conecta la wallet
  useEffect(() => {
    // Solo verificar si hay una nueva wallet conectada (address diferente) y estamos en la página principal
    if (address && address !== hasCheckedRef.current && pathname === '/') {
      hasCheckedRef.current = address;

      // Verificar si el usuario está registrado
      if (!isCheckingRegistration) {
        verifyAndRegisterUser(address)
          .then((result) => {
            // Si el usuario ya está registrado y tiene rol, redirigir automáticamente
            if (result.isRegistered && result.role) {
              setIsRegistered(true);
              setUserRole(result.role);
              const targetPath = result.role === 'lender' ? '/lend' : '/borrow';
              router.replace(targetPath);
            }
          })
          .catch(() => {
            // Error ya está manejado en el store
          });
      }
    }

    // Resetear el flag si el address cambia o se desconecta
    if (!address) {
      hasCheckedRef.current = undefined;
    }
  }, [address, isCheckingRegistration, pathname, router, setIsRegistered, setUserRole]);

  const handleRoleSelection = async (role: 'lender' | 'borrower') => {
    if (!address || isRegistering) return;

    try {
      setIsRegistering(true);
      useAuthStore.setState({ error: undefined });

      // Registrar usuario con el rol seleccionado
      await registerUser(address, role);
      setIsRegistered(true);
      setUserRole(role);

      // Navegar a la página correspondiente según el rol
      const targetPath = role === 'lender' ? '/lend' : '/borrow';
      router.replace(targetPath);
    } catch (error) {
      // Error ya está manejado en el store
      console.error('Error registering user:', error);
    } finally {
      setIsRegistering(false);
    }
  };

  // El modal solo se muestra para first timers (usuarios no registrados)
  // - Estamos en la página principal
  // - Hay wallet conectada
  // - Usuario NO está registrado
  // - No está verificando registro (para evitar flash)
  // - No está en proceso de registro
  const shouldShowModal = Boolean(
    pathname === '/' && address && !isRegistered && !isCheckingRegistration && !isRegistering,
  );

  // No mostrar el modal si no estamos en la página principal o si el usuario ya está registrado
  const shouldRender = pathname === '/' && !isRegistered;

  return {
    shouldShowModal,
    shouldRender,
    isRegistering,
    error,
    handleRoleSelection,
  };
}

