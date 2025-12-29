import { create } from 'zustand';

interface PoolsState {
  selectedPoolId: string | undefined;
}

interface PoolsActions {
  setSelectedPoolId: (poolId: string | undefined) => void;
  reset: () => void;
}

const initialState: PoolsState = {
  selectedPoolId: undefined,
};

export const usePoolsStore = create<PoolsState & PoolsActions>((set) => ({
  ...initialState,

  setSelectedPoolId: (poolId: string | undefined) =>
    set({
      selectedPoolId: poolId,
    }),

  reset: () =>
    set({
      ...initialState,
    }),
}));

