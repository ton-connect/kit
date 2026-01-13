/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StorageAdapter } from './types';

/**
 * Storage adapter for React Native using AsyncStorage
 *
 * @example
 * ```typescript
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * import { AsyncStorageAdapter } from '@demo/wallet-core/adapters';
 *
 * const storage = new AsyncStorageAdapter(AsyncStorage);
 * ```
 */
export class AsyncStorageAdapter implements StorageAdapter {
    constructor(
        private asyncStorage: {
            getItem: (key: string) => Promise<string | null>;
            setItem: (key: string, value: string) => Promise<void>;
            removeItem: (key: string) => Promise<void>;
        },
    ) {}

    async getItem(name: string): Promise<string | null> {
        return this.asyncStorage.getItem(name);
    }

    async setItem(name: string, value: string): Promise<void> {
        return this.asyncStorage.setItem(name, value);
    }

    async removeItem(name: string): Promise<void> {
        return this.asyncStorage.removeItem(name);
    }
}
