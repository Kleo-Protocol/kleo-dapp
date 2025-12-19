import { create } from 'zustand';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

export type WalletStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface WalletState {
  status: WalletStatus;
  error?: string;
  accounts: InjectedAccountWithMeta[];
  selectedAddress?: string;
}

interface WalletActions {
  setError: (message?: string) => void;
  setSelectedAddress: (address?: string) => void;
  setAccounts: (accounts: InjectedAccountWithMeta[]) => void;
  reset: () => void;
}

const initialState: WalletState = {
  status: 'idle',
  error: undefined,
  accounts: [],
  selectedAddress: undefined,
};

export const useAuthStore = create<WalletState & WalletActions>((set) => ({
  ...initialState,

  setError: (message?: string) =>
    set((state) => ({
      error: message,
      status: message ? 'error' : state.status,
    })),

  setSelectedAddress: (address?: string) =>
    set({
      selectedAddress: address,
    }),

  setAccounts: (accounts: InjectedAccountWithMeta[]) =>
    set({
      accounts,
      selectedAddress: accounts.length > 0 ? accounts[0].address : undefined,
      status: accounts.length > 0 ? 'connected' : 'idle',
    }),

  reset: () =>
    set({
      ...initialState,
    }),
}));
