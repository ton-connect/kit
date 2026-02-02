/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * LimitsManager - Enforces transaction, daily, and wallet count limits
 */

import type { LimitsConfig } from '../types/config.js';
import type { UserScopedStorage } from './UserScopedStorage.js';

/** TON has 9 decimal places */
const TON_DECIMALS = 9;

/**
 * Daily usage tracking data
 */
interface DailyUsage {
    /** ISO date string (YYYY-MM-DD) */
    date: string;
    /** Total TON spent today in nanoTON */
    totalSpentNano: string;
}

/**
 * Result of a limit check
 */
export interface LimitCheckResult {
    allowed: boolean;
    reason?: string;
}

/**
 * LimitsManager enforces safety limits on transactions and wallet counts.
 */
export class LimitsManager {
    private readonly limits: Required<LimitsConfig>;

    constructor(limits?: LimitsConfig) {
        // Default limits if not specified
        this.limits = {
            maxTransactionTon: limits?.maxTransactionTon ?? Infinity,
            dailyLimitTon: limits?.dailyLimitTon ?? Infinity,
            maxWalletsPerUser: limits?.maxWalletsPerUser ?? Infinity,
        };
    }

    /**
     * Check if a transaction amount is within limits
     */
    async checkTransactionLimit(storage: UserScopedStorage, amountTon: number): Promise<LimitCheckResult> {
        // Check per-transaction limit
        if (amountTon > this.limits.maxTransactionTon) {
            return {
                allowed: false,
                reason: `Transaction amount ${amountTon} TON exceeds maximum allowed ${this.limits.maxTransactionTon} TON per transaction`,
            };
        }

        // Check daily limit
        const today = this.getTodayDate();
        const usage = await this.getDailyUsage(storage, today);
        const currentSpentTon = this.nanoToTon(usage.totalSpentNano);
        const newTotalTon = currentSpentTon + amountTon;

        if (newTotalTon > this.limits.dailyLimitTon) {
            const remainingTon = Math.max(0, this.limits.dailyLimitTon - currentSpentTon);
            return {
                allowed: false,
                reason: `Transaction would exceed daily limit of ${this.limits.dailyLimitTon} TON. Already spent: ${currentSpentTon.toFixed(2)} TON. Remaining: ${remainingTon.toFixed(2)} TON`,
            };
        }

        return { allowed: true };
    }

    /**
     * Record a transaction for daily limit tracking
     */
    async recordTransaction(storage: UserScopedStorage, amountTon: number): Promise<void> {
        const today = this.getTodayDate();
        const usage = await this.getDailyUsage(storage, today);

        const currentNano = BigInt(usage.totalSpentNano);
        const addNano = BigInt(this.tonToNano(amountTon));
        const newTotalNano = (currentNano + addNano).toString();

        const newUsage: DailyUsage = {
            date: today,
            totalSpentNano: newTotalNano,
        };

        // Store with TTL of 25 hours to ensure it expires after the day ends
        await storage.set(`daily:${today}`, newUsage, 90000);
    }

    /**
     * Check if user can create another wallet
     */
    async checkWalletCountLimit(currentWalletCount: number): Promise<LimitCheckResult> {
        if (currentWalletCount >= this.limits.maxWalletsPerUser) {
            return {
                allowed: false,
                reason: `Maximum wallet limit of ${this.limits.maxWalletsPerUser} reached`,
            };
        }
        return { allowed: true };
    }

    /**
     * Get the configured limits
     */
    getLimits(): Required<LimitsConfig> {
        return { ...this.limits };
    }

    /**
     * Get today's date as ISO string (YYYY-MM-DD)
     */
    private getTodayDate(): string {
        return new Date().toISOString().split('T')[0]!;
    }

    /**
     * Get daily usage for a specific date
     */
    private async getDailyUsage(storage: UserScopedStorage, date: string): Promise<DailyUsage> {
        const usage = await storage.get<DailyUsage>(`daily:${date}`);
        return usage ?? { date, totalSpentNano: '0' };
    }

    /**
     * Convert TON to nanoTON string
     */
    private tonToNano(ton: number): string {
        const nano = BigInt(Math.floor(ton * Math.pow(10, TON_DECIMALS)));
        return nano.toString();
    }

    /**
     * Convert nanoTON string to TON
     */
    private nanoToTon(nano: string): number {
        return Number(BigInt(nano)) / Math.pow(10, TON_DECIMALS);
    }
}
