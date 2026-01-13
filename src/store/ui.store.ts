import { create } from 'zustand';

export type PoolTab = 'lend' | 'borrow' | 'history' | 'analytics';

interface ModalStates {
  [key: string]: boolean;
}

interface UiState {
  activePoolTab: PoolTab;
  modalStates: ModalStates;
}

interface UiActions {
  setActivePoolTab: (tab: PoolTab) => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
  isModalOpen: (modalId: string) => boolean;
  reset: () => void;
}

const initialState: UiState = {
  activePoolTab: 'lend',
  modalStates: {},
};

export const useUiStore = create<UiState & UiActions>((set, get) => ({
  ...initialState,

  setActivePoolTab: (tab: PoolTab) =>
    set({
      activePoolTab: tab,
    }),

  openModal: (modalId: string) =>
    set((state) => ({
      modalStates: {
        ...state.modalStates,
        [modalId]: true,
      },
    })),

  closeModal: (modalId: string) =>
    set((state) => ({
      modalStates: {
        ...state.modalStates,
        [modalId]: false,
      },
    })),

  toggleModal: (modalId: string) =>
    set((state) => ({
      modalStates: {
        ...state.modalStates,
        [modalId]: !state.modalStates[modalId],
      },
    })),

  isModalOpen: (modalId: string) => {
    return get().modalStates[modalId] === true;
  },

  reset: () =>
    set({
      ...initialState,
    }),
}));

