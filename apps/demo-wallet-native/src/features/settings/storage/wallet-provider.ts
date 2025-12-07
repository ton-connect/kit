/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CreateWalletStoreOptions } from '@ton/demo-core';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const walletProviderStorage: CreateWalletStoreOptions['storage'] = {
    getItem: async (key) => {
        return AsyncStorage.getItem(key);
    },
    setItem: async (key, value) => {
        await AsyncStorage.setItem(key, value);
    },
    removeItem: async (key) => {
        await AsyncStorage.removeItem(key);
    },
};
