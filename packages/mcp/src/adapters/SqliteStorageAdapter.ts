/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * SqliteStorageAdapter - SQLite-based persistent storage
 *
 * Features:
 * - Persistent key-value storage using SQLite
 * - TTL support with automatic cleanup
 * - Thread-safe operations via better-sqlite3
 */

import type { IStorageAdapter } from '../types/storage.js';

/**
 * Database interface for SQLite operations.
 * This allows injecting a better-sqlite3 database instance.
 */
export interface SqliteDatabase {
    prepare(sql: string): {
        run(...params: unknown[]): { changes: number };
        get(...params: unknown[]): unknown;
        all(...params: unknown[]): unknown[];
    };
    exec(sql: string): void;
}

/**
 * Configuration for SqliteStorageAdapter
 */
export interface SqliteStorageConfig {
    /** SQLite database instance */
    db: SqliteDatabase;
    /** Table name for storage (default: 'storage') */
    tableName?: string;
}

/**
 * SQLite-based storage adapter for persistent key-value storage.
 * Uses better-sqlite3 for synchronous, thread-safe operations.
 */
export class SqliteStorageAdapter implements IStorageAdapter {
    private readonly db: SqliteDatabase;
    private readonly tableName: string;

    constructor(config: SqliteStorageConfig) {
        this.db = config.db;
        this.tableName = config.tableName ?? 'storage';
        this.initializeTable();
    }

    /**
     * Initialize the storage table
     */
    private initializeTable(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS ${this.tableName} (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                expires_at INTEGER
            )
        `);

        // Create index for TTL cleanup
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_${this.tableName}_expires 
            ON ${this.tableName}(expires_at) 
            WHERE expires_at IS NOT NULL
        `);
    }

    /**
     * Clean up expired entries
     */
    private cleanupExpired(): void {
        const now = Date.now();
        this.db.prepare(`DELETE FROM ${this.tableName} WHERE expires_at IS NOT NULL AND expires_at < ?`).run(now);
    }

    /**
     * Get a value by key
     */
    async get<T>(key: string): Promise<T | null> {
        this.cleanupExpired();

        const row = this.db.prepare(`SELECT value, expires_at FROM ${this.tableName} WHERE key = ?`).get(key) as
            | { value: string; expires_at: number | null }
            | undefined;

        if (!row) {
            return null;
        }

        // Check if expired
        if (row.expires_at !== null && row.expires_at < Date.now()) {
            await this.delete(key);
            return null;
        }

        try {
            return JSON.parse(row.value) as T;
        } catch {
            return null;
        }
    }

    /**
     * Set a value with optional TTL
     */
    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        const jsonValue = JSON.stringify(value);
        const expiresAt = ttlSeconds !== undefined && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;

        this.db
            .prepare(`INSERT OR REPLACE INTO ${this.tableName} (key, value, expires_at) VALUES (?, ?, ?)`)
            .run(key, jsonValue, expiresAt);
    }

    /**
     * Delete a key
     */
    async delete(key: string): Promise<boolean> {
        const result = this.db.prepare(`DELETE FROM ${this.tableName} WHERE key = ?`).run(key);
        return result.changes > 0;
    }

    /**
     * List keys matching prefix
     */
    async list(prefix: string): Promise<string[]> {
        this.cleanupExpired();

        const rows = this.db.prepare(`SELECT key FROM ${this.tableName} WHERE key LIKE ?`).all(`${prefix}%`) as {
            key: string;
        }[];

        return rows.map((row) => row.key);
    }

    /**
     * Clear all data (useful for testing)
     */
    clear(): void {
        this.db.exec(`DELETE FROM ${this.tableName}`);
    }

    /**
     * Get the number of stored items
     */
    size(): number {
        this.cleanupExpired();
        const row = this.db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`).get() as { count: number };
        return row.count;
    }
}
