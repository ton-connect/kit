/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * SQLite schema initialization for the Telegram bot
 */

import { dirname } from 'path';
import { mkdirSync } from 'fs';

import Database from 'better-sqlite3';

/**
 * Initialize the database with all required tables
 */
export function initializeDatabase(dbPath: string): Database.Database {
    // Ensure the directory exists
    const dir = dirname(dbPath);
    mkdirSync(dir, { recursive: true });

    const db = new Database(dbPath);

    // Enable WAL mode for better concurrent performance
    db.pragma('journal_mode = WAL');

    // Create storage table (used by SqliteStorageAdapter)
    db.exec(`
        CREATE TABLE IF NOT EXISTS storage (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            expires_at INTEGER
        )
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_storage_expires 
        ON storage(expires_at) 
        WHERE expires_at IS NOT NULL
    `);

    // Create wallets table (used by SqliteSignerAdapter)
    db.exec(`
        CREATE TABLE IF NOT EXISTS wallets (
            wallet_id TEXT PRIMARY KEY,
            encrypted_mnemonic TEXT NOT NULL,
            public_key TEXT NOT NULL,
            address TEXT NOT NULL,
            network TEXT NOT NULL,
            version TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_wallets_address 
        ON wallets(address)
    `);

    // Create profiles table (for public user profiles)
    db.exec(`
        CREATE TABLE IF NOT EXISTS profiles (
            telegram_id INTEGER PRIMARY KEY,
            username TEXT,
            first_name TEXT,
            wallet_address TEXT NOT NULL,
            is_public INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_profiles_username 
        ON profiles(username) 
        WHERE username IS NOT NULL
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_profiles_wallet 
        ON profiles(wallet_address)
    `);

    return db;
}

/**
 * Profile row structure
 */
export interface ProfileRow {
    telegram_id: number;
    username: string | null;
    first_name: string | null;
    wallet_address: string;
    is_public: number;
    created_at: string;
    updated_at: string;
}
