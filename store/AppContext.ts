import { create } from "zustand";

type ReadyStore = {
  ready: boolean;
  makeReady: () => void;
};

export const AppStore = create<ReadyStore>((set) => ({
  ready: false,

  makeReady: () =>
    set({
      ready: true,
    }),
}));