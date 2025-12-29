import { create } from 'zustand';

export type UserTier = 'rojo' | 'amarillo' | 'verde';

interface UserState {
  walletAddress: string | undefined;
  capital: number;
  reputation: number;
  tier: UserTier;
  incomeReference: string | undefined;
}

interface UserActions {
  setWalletAddress: (address: string | undefined) => void;
  setCapital: (capital: number) => void;
  setReputation: (reputation: number) => void;
  setTier: (tier: UserTier) => void;
  setIncomeReference: (reference: string | undefined) => void;
  reset: () => void;
}

const initialState: UserState = {
  walletAddress: undefined,
  capital: 0,
  reputation: 0,
  tier: 'rojo',
  incomeReference: undefined,
};

export const useUserStore = create<UserState & UserActions>((set) => ({
  ...initialState,

  setWalletAddress: (address: string | undefined) =>
    set({
      walletAddress: address,
    }),

  setCapital: (capital: number) =>
    set({
      capital,
    }),

  setReputation: (reputation: number) =>
    set({
      reputation,
    }),

  setTier: (tier: UserTier) =>
    set({
      tier,
    }),

  setIncomeReference: (reference: string | undefined) =>
    set({
      incomeReference: reference,
    }),

  reset: () =>
    set({
      ...initialState,
    }),
}));
