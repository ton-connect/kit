/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * SqliteStorageAdapter - SQLite-based persistent storage
 */

import type { IStorageAdapter } from './types.js';

/**
 * Database interface for SQLite operations.
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
    db: SqliteDatabase;
    tableName?: string;
}

/**
 * SQLite-based storage adapter for persistent key-value storage.
 */
export class SqliteStorageAdapter implements IStorageAdapter {
    private readonly db: SqliteDatabase;
    private readonly tableName: string;

    constructor(config: SqliteStorageConfig) {
        this.db = config.db;
        this.tableName = config.tableName ?? 'storage';
        this.initializeTable();
    }

    private initializeTable(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS ${this.tableName} (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                expires_at INTEGER
            )
        `);

        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_${this.tableName}_expires 
            ON ${this.tableName}(expires_at) 
            WHERE expires_at IS NOT NULL
        `);
    }

    private cleanupExpired(): void {
        const now = Date.now();
        this.db.prepare(`DELETE FROM ${this.tableName} WHERE expires_at IS NOT NULL AND expires_at < ?`).run(now);
    }

    async get<T>(key: string): Promise<T | null> {
        this.cleanupExpired();

        const row = this.db.prepare(`SELECT value, expires_at FROM ${this.tableName} WHERE key = ?`).get(key) as
            | { value: string; expires_at: number | null }
            | undefined;

        if (!row) {
            return null;
        }

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

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        const jsonValue = JSON.stringify(value);
        const expiresAt = ttlSeconds !== undefined && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;

        this.db
            .prepare(`INSERT OR REPLACE INTO ${this.tableName} (key, value, expires_at) VALUES (?, ?, ?)`)
            .run(key, jsonValue, expiresAt);
    }

    async delete(key: string): Promise<boolean> {
        const result = this.db.prepare(`DELETE FROM ${this.tableName} WHERE key = ?`).run(key);
        return result.changes > 0;
    }

    async list(prefix: string): Promise<string[]> {
        this.cleanupExpired();

        const rows = this.db.prepare(`SELECT key FROM ${this.tableName} WHERE key LIKE ?`).all(`${prefix}%`) as {
            key: string;
        }[];

        return rows.map((row) => row.key);
    }

    clear(): void {
        this.db.exec(`DELETE FROM ${this.tableName}`);
    }

    size(): number {
        this.cleanupExpired();
        const row = this.db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`).get() as { count: number };
        return row.count;
    }
}
