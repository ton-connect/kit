/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CreateWalletStoreOptions } from '@ton/demo-core';
import { setItemAsync, deleteItemAsync, getItemAsync } from 'expo-secure-store';

export const walletProviderStorage: CreateWalletStoreOptions['storage'] = {
    getItem: async (key) => {
        return getItemAsync(key);
    },
    setItem: async (key, value) => {
        await setItemAsync(key, value);
    },
    removeItem: async (key) => {
        await deleteItemAsync(key);
    },
};
