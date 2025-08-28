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
    namespace?: string;
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
