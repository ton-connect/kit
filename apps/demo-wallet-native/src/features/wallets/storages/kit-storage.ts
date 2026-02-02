/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StorageAdapter } from '@ton/walletkit';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();

export const kitStorage: StorageAdapter = {
    get(key: string) {
        return Promise.resolve(storage.getString(key) || null);
    },
    set(key: string, value: string): Promise<void> {
        storage.set(key, value);

        return Promise.resolve();
    },
    remove(key: string): Promise<void> {
        storage.remove(key);

        return Promise.resolve();
    },
    clear(): Promise<void> {
        storage.clearAll();

        return Promise.resolve();
    },
};
