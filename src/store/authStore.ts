import { create } from 'zustand';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import type { User, Session } from '@supabase/supabase-js';

export type WalletStatus = 'idle' | 'connecting' | 'connected' | 'error';
export type UserRole = 'lender' | 'borrower' | null;

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  surname: string;
  email: string;
  walletAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface WalletState {
  // Wallet state (for blockchain transactions)
  status: WalletStatus;
  error?: string;
  accounts: InjectedAccountWithMeta[];
  selectedAddress?: string;
  userRole: UserRole;
  isRegistered: boolean;
  isCheckingRegistration: boolean;
  // Supabase auth state
  supabaseUser: User | null;
  supabaseSession: Session | null;
  profile: UserProfile | null;
}

interface WalletActions {
  // Wallet actions
  setError: (message?: string) => void;
  setSelectedAddress: (address?: string) => void;
  setAccounts: (accounts: InjectedAccountWithMeta[]) => void;
  setUserRole: (role: UserRole) => void;
  setIsRegistered: (isRegistered: boolean) => void;
  setIsCheckingRegistration: (isChecking: boolean) => void;
  // Supabase actions
  setSupabaseUser: (user: User | null) => void;
  setSupabaseSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  reset: () => void;
}

const initialState: WalletState = {
  status: 'idle',
  error: undefined,
  accounts: [],
  selectedAddress: undefined,
  userRole: null,
  isRegistered: false,
  isCheckingRegistration: false,
  supabaseUser: null,
  supabaseSession: null,
  profile: null,
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

  setUserRole: (role: UserRole) =>
    set({
      userRole: role,
    }),

  setIsRegistered: (isRegistered: boolean) =>
    set({
      isRegistered,
    }),

  setIsCheckingRegistration: (isChecking: boolean) =>
    set({
      isCheckingRegistration: isChecking,
    }),

  setSupabaseUser: (user: User | null) =>
    set({
      supabaseUser: user,
    }),

  setSupabaseSession: (session: Session | null) =>
    set({
      supabaseSession: session,
    }),

  setProfile: (profile: UserProfile | null) =>
    set({
      profile,
    }),

  reset: () =>
    set({
      ...initialState,
    }),
}));
