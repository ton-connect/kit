/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StorageAdapter } from './types';

/**
 * Storage adapter for browser extensions using chrome.storage.local
 *
 * @example
 * ```typescript
 * import browser from 'webextension-polyfill';
 * import { ExtensionStorageAdapter } from '@demo/core/adapters';
 *
 * const storage = new ExtensionStorageAdapter(browser.storage.local);
 * ```
 */
export class ExtensionStorageAdapter implements StorageAdapter {
    constructor(
        private extensionStorage: {
            get: (keys: string | string[]) => Promise<{ [key: string]: unknown }>;
            set: (items: { [key: string]: unknown }) => Promise<void>;
            remove: (keys: string | string[]) => Promise<void>;
        },
    ) {}

    async getItem(name: string): Promise<string | null> {
        const result = await this.extensionStorage.get(name);
        return result[name] as string | null;
    }

    async setItem(name: string, value: string): Promise<void> {
        await this.extensionStorage.set({ [name]: value });
    }

    async removeItem(name: string): Promise<void> {
        await this.extensionStorage.remove(name);
    }
}
