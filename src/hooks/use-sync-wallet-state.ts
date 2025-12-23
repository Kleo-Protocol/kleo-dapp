'use client';

import { useEffect, useRef } from 'react';
import { useTypink } from 'typink';
import { useAuthStore } from '@/store/authStore';

/**
 * Hook que sincroniza el estado de typink con nuestro authStore de Zustand
 * Esto mantiene ambos sistemas en sincronía
 */
export function useSyncWalletState() {
  const { accounts, connectedAccount, connectedWallets } = useTypink();
  const setAccounts = useAuthStore((state) => state.setAccounts);
  const setSelectedAddress = useAuthStore((state) => state.setSelectedAddress);
  const setError = useAuthStore((state) => state.setError);
  
  // Usar refs para evitar loops infinitos
  const accountsRef = useRef<string[]>([]);
  const connectedAddressRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const currentAddresses = accounts.map((a) => a.address).join(',');
    const connectedAddress = connectedAccount?.address;

    // Solo actualizar si realmente cambió
    if (currentAddresses !== accountsRef.current.join(',')) {
      accountsRef.current = accounts.map((a) => a.address);

      // Convertir cuentas de typink al formato de InjectedAccountWithMeta
      const injectedAccounts = accounts.map((account) => ({
        address: account.address,
        meta: {
          name: account.name || account.address,
          source: account.source || connectedWallets[0]?.id || 'unknown',
          genesisHash: null,
        },
      }));

      // Sincronizar cuentas
      if (injectedAccounts.length > 0) {
        setAccounts(injectedAccounts);
      } else {
        setAccounts([]);
        useAuthStore.setState({ status: 'idle' });
      }
    }

    // Sincronizar cuenta seleccionada
    if (connectedAddress !== connectedAddressRef.current) {
      connectedAddressRef.current = connectedAddress;
      
      if (connectedAccount) {
        setSelectedAddress(connectedAccount.address);
        useAuthStore.setState({ status: 'connected' });
      } else if (accounts.length === 0) {
        setSelectedAddress(undefined);
        useAuthStore.setState({ status: 'idle' });
      }
    }
  }, [accounts, connectedAccount, connectedWallets, setAccounts, setSelectedAddress]);

  // Limpiar errores cuando se conecta exitosamente
  useEffect(() => {
    if (accounts.length > 0 && connectedAccount) {
      setError(undefined);
    }
  }, [accounts.length, connectedAccount, setError]);
}
