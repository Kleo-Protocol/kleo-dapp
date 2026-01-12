'use client';

import { useEffect, useRef } from 'react';
import { useTypink } from 'typink';
import { useAuthStore } from '@/store/authStore';

/**
 * Hook that synchronizes typink state with our Zustand authStore
 * This keeps both systems in sync
 */
export function useSyncWalletState() {
  const { accounts, connectedAccount, connectedWallets } = useTypink();
  const setAccounts = useAuthStore((state) => state.setAccounts);
  const setSelectedAddress = useAuthStore((state) => state.setSelectedAddress);
  const setError = useAuthStore((state) => state.setError);
  
  // Use refs to avoid infinite loops
  const accountsRef = useRef<string[]>([]);
  const connectedAddressRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const currentAddresses = accounts.map((a) => a.address).join(',');
    const connectedAddress = connectedAccount?.address;

    // Only update if it actually changed
    if (currentAddresses !== accountsRef.current.join(',')) {
      accountsRef.current = accounts.map((a) => a.address);

      // Convert typink accounts to InjectedAccountWithMeta format
      const injectedAccounts = accounts.map((account) => ({
        address: account.address,
        meta: {
          name: account.name || account.address,
          source: account.source || connectedWallets[0]?.id || 'unknown',
          genesisHash: null,
        },
      }));

      // Sync accounts
      if (injectedAccounts.length > 0) {
        setAccounts(injectedAccounts);
      } else {
        setAccounts([]);
        useAuthStore.setState({ status: 'idle' });
      }
    }

    // Sync selected account
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

  // Clear errors when successfully connected
  useEffect(() => {
    if (accounts.length > 0 && connectedAccount) {
      setError(undefined);
    }
  }, [accounts.length, connectedAccount, setError]);
}
