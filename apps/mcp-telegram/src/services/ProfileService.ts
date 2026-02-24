/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ProfileService - Manages public user profiles for the Telegram bot
 *
 * Features:
 * - Store and retrieve user profiles (username -> wallet mapping)
 * - Resolve @username to wallet address for transfers
 * - Public profile discovery
 */

import type Database from 'better-sqlite3';

import type { ProfileRow } from '../db/schema.js';

/**
 * User profile data
 */
export interface UserProfile {
    telegramId: number;
    username: string | null;
    firstName: string | null;
    walletAddress: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * ProfileService manages user profiles and username resolution
 */
export class ProfileService {
    constructor(private readonly db: Database.Database) {}

    /**
     * Create or update a user profile
     */
    createOrUpdateProfile(
        telegramId: number,
        walletAddress: string,
        username?: string | null,
        firstName?: string | null,
    ): UserProfile {
        const now = new Date().toISOString();

        // Check if profile exists
        const existing = this.db.prepare('SELECT * FROM profiles WHERE telegram_id = ?').get(telegramId) as
            | ProfileRow
            | undefined;

        if (existing) {
            // Update existing profile
            this.db
                .prepare(
                    `UPDATE profiles 
                     SET username = ?, first_name = ?, wallet_address = ?, updated_at = ?
                     WHERE telegram_id = ?`,
                )
                .run(username ?? existing.username, firstName ?? existing.first_name, walletAddress, now, telegramId);
        } else {
            // Create new profile
            this.db
                .prepare(
                    `INSERT INTO profiles (telegram_id, username, first_name, wallet_address, is_public, created_at, updated_at)
                     VALUES (?, ?, ?, ?, 1, ?, ?)`,
                )
                .run(telegramId, username ?? null, firstName ?? null, walletAddress, now, now);
        }

        return this.getProfile(telegramId)!;
    }

    /**
     * Get a profile by telegram ID
     */
    getProfile(telegramId: number): UserProfile | null {
        const row = this.db.prepare('SELECT * FROM profiles WHERE telegram_id = ?').get(telegramId) as
            | ProfileRow
            | undefined;

        if (!row) {
            return null;
        }

        return this.rowToProfile(row);
    }

    /**
     * Find a profile by username
     */
    findByUsername(username: string): UserProfile | null {
        // Remove @ prefix if present
        const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

        const row = this.db
            .prepare('SELECT * FROM profiles WHERE username = ? AND is_public = 1')
            .get(cleanUsername) as ProfileRow | undefined;

        if (!row) {
            return null;
        }

        return this.rowToProfile(row);
    }

    /**
     * Resolve a username to wallet address
     * Returns null if user not found or profile is private
     */
    resolveUsernameToAddress(username: string): string | null {
        const profile = this.findByUsername(username);
        return profile?.walletAddress ?? null;
    }

    /**
     * Find a profile by wallet address
     */
    findByWalletAddress(walletAddress: string): UserProfile | null {
        const row = this.db
            .prepare('SELECT * FROM profiles WHERE wallet_address = ? AND is_public = 1')
            .get(walletAddress) as ProfileRow | undefined;

        if (!row) {
            return null;
        }

        return this.rowToProfile(row);
    }

    /**
     * Update profile visibility
     */
    setPublicVisibility(telegramId: number, isPublic: boolean): boolean {
        const result = this.db
            .prepare('UPDATE profiles SET is_public = ?, updated_at = ? WHERE telegram_id = ?')
            .run(isPublic ? 1 : 0, new Date().toISOString(), telegramId);

        return result.changes > 0;
    }

    /**
     * Delete a profile
     */
    deleteProfile(telegramId: number): boolean {
        const result = this.db.prepare('DELETE FROM profiles WHERE telegram_id = ?').run(telegramId);
        return result.changes > 0;
    }

    /**
     * Convert database row to UserProfile
     */
    private rowToProfile(row: ProfileRow): UserProfile {
        return {
            telegramId: row.telegram_id,
            username: row.username,
            firstName: row.first_name,
            walletAddress: row.wallet_address,
            isPublic: row.is_public === 1,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
