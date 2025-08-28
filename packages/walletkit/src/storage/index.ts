// Storage module exports

export type { StorageAdapter, StorageConfig, StorageResult, StorageMetrics } from './types';
export { createStorageAdapter } from './adapters';
export { LocalStorageAdapter } from './adapters/local';
export { MemoryStorageAdapter } from './adapters/memory';
export { ExtensionStorageAdapter } from './adapters/extension';
