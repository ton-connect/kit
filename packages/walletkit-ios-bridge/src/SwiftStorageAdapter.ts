/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StorageAdapter } from '@ton/walletkit';

/**
 * In-memory storage adapter for testing and temporary storage
 */
export class SwiftStorageAdapter implements StorageAdapter {
    private swiftStorage: StorageAdapter;

    constructor(swiftStorage: StorageAdapter) {
        this.swiftStorage = swiftStorage;
    }

    async get(key: string): Promise<string | null> {
        return await this.swiftStorage.get(key);
    }

    async set(key: string, value: string): Promise<void> {
        await this.swiftStorage.set(key, value);
    }

    async remove(key: string): Promise<void> {
        await this.swiftStorage.remove(key);
    }

    async clear(): Promise<void> {
        await this.swiftStorage.clear();
    }
}
