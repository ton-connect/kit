/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Storage adapter implementations

import type { StorageAdapter, StorageConfig } from './types';
import { globalLogger } from '../core/Logger';
import { LocalStorageAdapter } from './adapters/local';
import { MemoryStorageAdapter } from './adapters/memory';

const log = globalLogger.createChild('StorageAdapter');

/**
 * Create storage adapter based on environment and preferences
 */
export function createStorageAdapter(config: StorageConfig = {}): StorageAdapter {
    // Check if localStorage is available
    if (typeof localStorage !== 'undefined') {
        try {
            return new LocalStorageAdapter(config);
        } catch (error) {
            log.warn('Failed to create LocalStorageAdapter, falling back to memory', { error });
        }
    }

    if (config.allowMemory) {
        return new MemoryStorageAdapter(config);
    } else {
        throw new Error('No storage adapter available');
    }
}
