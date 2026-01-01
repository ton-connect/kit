/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StoreApi } from 'zustand';

import type { AppState } from '../../types/store';

let store: StoreApi<AppState> | undefined;

export const setStore = (nextStore: StoreApi<AppState>) => {
    store = nextStore;
};

export const getStore = () => {
    if (!store) throw new Error('Store is not initialized');

    return store;
};
