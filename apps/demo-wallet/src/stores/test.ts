import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { mergeDeepLeft } from 'ramda';

const UseBearSlice = (set) => ({
    bears: 0,
    bearsList: [],
    addBears: (by) =>
        set((state) => {
            state.BearSlice.bears += by;
        }),
    bearsLoading: false,
    fetchBears: async (pond) => {
        set((state) => {
            state.BearSlice.bearsList = [];
            state.BearSlice.bearsLoading = true;
        });
        const results = await (await fetch(pond)).json();

        set((state) => {
            state.BearSlice.bearsList = results;
            state.BearSlice.bearsLoading = false;
        });
    },
});

const UseBeesSlice = (set) => ({
    bees: 0,
    addBees: (by) =>
        set((state) => {
            state.BeesSlice.bees += by;
        }),
    removeBees: (by) =>
        set((state) => {
            state.BeesSlice.bees -= by;
        }),
});

const store = (set) => ({
    BearSlice: UseBearSlice(set),
    BeesSlice: UseBeesSlice(set),
});

const useStore = create(
    devtools(
        persist(immer(store), {
            name: 'zustand',
            getStorage: () => localStorage,
            merge: (persistedState, currentState) => mergeDeepLeft(persistedState, currentState),
        }),
    ),
);

export default useStore;
