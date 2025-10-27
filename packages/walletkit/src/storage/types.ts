/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Storage-related types and interfaces

/**
 * Async storage adapter interface
 */
export interface StorageAdapter {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
}

/**
 * Configuration for storage adapters
 */
export interface StorageConfig {
    prefix?: string;
    maxRetries?: number;
    retryDelay?: number;
    allowMemory?: boolean;
}

/**
 * Storage operation result
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface StorageResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Storage metrics for monitoring
 */
export interface StorageMetrics {
    operations: number;
    errors: number;
    lastOperation: Date;
    avgOperationTime: number;
}
