/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CallForSuccess } from '../../utils/retry';
import { StorageAdapter, StorageConfig } from '../types';

/**
 * localStorage adapter for web environments
 */
export class ExtensionStorageAdapter implements StorageAdapter {
    private prefix: string;
    private maxRetries: number;
    private retryDelay: number;
    private localStorage: Storage;

    constructor(config: StorageConfig = {}, _localStorage?: Storage) {
        this.prefix = config.prefix || 'tonwallet:';
        this.maxRetries = config.maxRetries || 3;
        this.retryDelay = config.retryDelay || 100;

        if (_localStorage) {
            this.localStorage = _localStorage;
        } else {
            this.localStorage = window.localStorage;
        }

        // this.validateEnvironment();
    }

    async get<T>(key: string): Promise<T | null> {
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
            return item ? JSON.parse(item) : null;
        });
    }

    async set<T>(key: string, value: T): Promise<void> {
        return this.withRetry(async () => {
            const fullKey = this.prefix + key;
            await this.localStorage.set({
                [fullKey]: JSON.stringify(value),
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
            const keysToRemove = await this.getPrefixedKeys();
            await Promise.all(keysToRemove.map((key) => this.localStorage.remove(key)));
        });
    }

    private async getPrefixedKeys(): Promise<string[]> {
        const items: Record<string, unknown> = await this.localStorage.items();
        const keys: string[] = [];
        for (const key in Object.keys(items)) {
            if (key.startsWith(this.prefix)) {
                keys.push(key);
            }
        }

        return keys;
    }

    private async withRetry<T>(operation: () => T): Promise<T> {
        return CallForSuccess(operation, this.maxRetries, this.retryDelay);
    }
}
