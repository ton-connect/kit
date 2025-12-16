/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CallForSuccess } from '../../utils/retry';
import type { StorageAdapter, StorageConfig } from '../types';

/**
 * localStorage adapter for web environments
 */
export class LocalStorageAdapter implements StorageAdapter {
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

    async get(key: string): Promise<string | null> {
        return this.withRetry(async () => {
            const fullKey = this.prefix + key;
            return this.localStorage.getItem(fullKey);
        });
    }

    async set(key: string, value: string): Promise<void> {
        return this.withRetry(async () => {
            const fullKey = this.prefix + key;
            this.localStorage.setItem(fullKey, value);
        });
    }

    async remove(key: string): Promise<void> {
        return this.withRetry(async () => {
            const fullKey = this.prefix + key;
            this.localStorage.removeItem(fullKey);
        });
    }

    async clear(): Promise<void> {
        return this.withRetry(async () => {
            const keysToRemove = this.getPrefixedKeys();
            keysToRemove.forEach((key) => this.localStorage.removeItem(key));
        });
    }

    private getPrefixedKeys(): string[] {
        const keys: string[] = [];
        for (let i = 0; i < this.localStorage.length; i++) {
            const key = this.localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keys.push(key);
            }
        }
        return keys;
    }

    private async withRetry<T>(operation: () => T): Promise<T> {
        return CallForSuccess(operation, this.maxRetries, this.retryDelay);
    }
}
