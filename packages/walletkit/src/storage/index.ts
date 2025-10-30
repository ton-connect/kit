/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Storage module exports

export type { StorageAdapter, StorageConfig, StorageResult, StorageMetrics } from './types';
export { createStorageAdapter } from './adapters';
export { LocalStorageAdapter } from './adapters/local';
export { MemoryStorageAdapter } from './adapters/memory';
export { ExtensionStorageAdapter } from './adapters/extension';
export { Storage } from './Storage';
