/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StorageAdapter } from './types';

/**
 * Storage adapter for web applications using localStorage
 */
export class LocalStorageAdapter implements StorageAdapter {
    getItem(name: string): string | null {
        return localStorage.getItem(name);
    }

    setItem(name: string, value: string): void {
        localStorage.setItem(name, value);
    }

    removeItem(name: string): void {
        localStorage.removeItem(name);
    }
}
