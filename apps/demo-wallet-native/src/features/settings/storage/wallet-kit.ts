/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StorageAdapter as KitStorageAdapter } from '@ton/walletkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: replace with secure store
export const walletKitStorage: KitStorageAdapter = {
    get: async (key) => {
        return AsyncStorage.getItem(key);
    },
    set: async (key, value) => {
        AsyncStorage.setItem(key, value);
    },
    remove: async (key) => {
        AsyncStorage.removeItem(key);
    },
    clear: async () => {
        AsyncStorage.clear();
    },
};
