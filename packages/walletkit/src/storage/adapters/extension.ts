/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CallForSuccess } from '../../utils/retry';
import type { StorageAdapter, StorageConfig } from '../types';

interface ExtensionStorage {
    get(keys?: null | string | string[] | Record<string, unknown>): Promise<Record<string, unknown>>;
    set(items: Record<string, unknown>): Promise<void>;
    remove(keys: string | string[]): Promise<void>;
    clear(): Promise<void>;
}

/**
 * localStorage adapter for web environments
 */
export class ExtensionStorageAdapter implements StorageAdapter {
    private prefix: string;
    private maxRetries: number;
    private retryDelay: number;
    private localStorage: ExtensionStorage;

    constructor(config: StorageConfig = {}, localStorage: ExtensionStorage) {
        this.prefix = config.prefix || 'tonwallet:';
        this.maxRetries = config.maxRetries || 3;
        this.retryDelay = config.retryDelay || 100;

        this.localStorage = localStorage;

        // this.validateEnvironment();
    }

    async get(key: string): Promise<string | null> {
        return this.withRetry(async () => {
            const fullKey = this.prefix + key;
            const itemObj = await this.localStorage.get(fullKey);
            if (!itemObj) {
                return null;
            }
            const item = itemObj[fullKey];
            if (!item) {
                return null;
            }
            return item.toString();
        });
    }

    async set(key: string, value: string): Promise<void> {
        return this.withRetry(async () => {
            const fullKey = this.prefix + key;
            await this.localStorage.set({
                [fullKey]: value,
            });
        });
    }

    async remove(key: string): Promise<void> {
        return this.withRetry(async () => {
            const fullKey = this.prefix + key;
            await this.localStorage.remove(fullKey);
        });
    }

    async clear(): Promise<void> {
        return this.withRetry(async () => {
            return this.localStorage.clear();
        });
    }

    private async withRetry<T>(operation: () => T): Promise<T> {
        return CallForSuccess(operation, this.maxRetries, this.retryDelay);
    }
}
