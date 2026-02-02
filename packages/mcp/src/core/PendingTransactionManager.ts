/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * PendingTransactionManager - Manages two-step transaction confirmation flow
 *
 * When requireConfirmation is enabled:
 * 1. send_ton/send_jetton/execute_swap creates a pending transaction
 * 2. User must call confirm_transaction to execute
 * 3. Or cancel_transaction to abort
 */

import type { UserScopedStorage } from './UserScopedStorage.js';

/**
 * Pending transaction types
 */
export type PendingTransactionType = 'send_ton' | 'send_jetton' | 'swap';

/**
 * Pending transaction data stored in storage
 */
export interface PendingTransaction {
    /** Unique transaction ID */
    id: string;
    /** Transaction type */
    type: PendingTransactionType;
    /** Wallet name to send from */
    walletName: string;
    /** ISO timestamp when created */
    createdAt: string;
    /** ISO timestamp when expires */
    expiresAt: string;
    /** Human-readable description for confirmation */
    description: string;
    /** Transaction-specific data */
    data: PendingTonTransfer | PendingJettonTransfer | PendingSwap;
}

/**
 * Pending TON transfer data
 */
export interface PendingTonTransfer {
    type: 'send_ton';
    toAddress: string;
    /** Amount in nanoTON */
    amountNano: string;
    /** Human-readable amount */
    amountTon: string;
    comment?: string;
}

/**
 * Pending Jetton transfer data
 */
export interface PendingJettonTransfer {
    type: 'send_jetton';
    toAddress: string;
    jettonAddress: string;
    /** Raw amount */
    amountRaw: string;
    /** Human-readable amount */
    amountHuman: string;
    symbol?: string;
    decimals: number;
    comment?: string;
}

/**
 * Pending swap data
 */
export interface PendingSwap {
    type: 'swap';
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    minReceived: string;
    provider: string;
    /** Serialized quote for execution */
    quoteJson: string;
}

/** Default pending transaction TTL in seconds (5 minutes) */
const DEFAULT_PENDING_TTL_SECONDS = 300;

/**
 * PendingTransactionManager handles the confirmation flow for transactions.
 */
export class PendingTransactionManager {
    private readonly ttlSeconds: number;

    constructor(ttlSeconds: number = DEFAULT_PENDING_TTL_SECONDS) {
        this.ttlSeconds = ttlSeconds;
    }

    /**
     * Generate a unique transaction ID
     */
    generateId(): string {
        return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Create a pending transaction
     */
    async createPending(
        storage: UserScopedStorage,
        params: {
            type: PendingTransactionType;
            walletName: string;
            description: string;
            data: PendingTonTransfer | PendingJettonTransfer | PendingSwap;
        },
    ): Promise<PendingTransaction> {
        const id = this.generateId();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + this.ttlSeconds * 1000);

        const pending: PendingTransaction = {
            id,
            type: params.type,
            walletName: params.walletName,
            createdAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            description: params.description,
            data: params.data,
        };

        await storage.set(`pending:${id}`, pending, this.ttlSeconds);

        return pending;
    }

    /**
     * Get a pending transaction by ID
     */
    async getPending(storage: UserScopedStorage, transactionId: string): Promise<PendingTransaction | null> {
        const pending = await storage.get<PendingTransaction>(`pending:${transactionId}`);

        if (!pending) {
            return null;
        }

        // Check if expired
        if (new Date(pending.expiresAt) < new Date()) {
            await this.deletePending(storage, transactionId);
            return null;
        }

        return pending;
    }

    /**
     * List all pending transactions for the user
     */
    async listPending(storage: UserScopedStorage): Promise<PendingTransaction[]> {
        const keys = await storage.list('pending:');
        const now = new Date();

        const transactions: PendingTransaction[] = [];

        for (const key of keys) {
            const pending = await storage.get<PendingTransaction>(key);
            if (pending && new Date(pending.expiresAt) >= now) {
                transactions.push(pending);
            }
        }

        // Sort by creation time (newest first)
        return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    /**
     * Delete a pending transaction
     */
    async deletePending(storage: UserScopedStorage, transactionId: string): Promise<boolean> {
        return storage.delete(`pending:${transactionId}`);
    }

    /**
     * Mark a pending transaction as confirmed (delete it)
     * The actual execution is handled by the caller
     */
    async confirmPending(storage: UserScopedStorage, transactionId: string): Promise<PendingTransaction | null> {
        const pending = await this.getPending(storage, transactionId);

        if (!pending) {
            return null;
        }

        await this.deletePending(storage, transactionId);

        return pending;
    }

    /**
     * Cancel a pending transaction
     */
    async cancelPending(storage: UserScopedStorage, transactionId: string): Promise<boolean> {
        const pending = await this.getPending(storage, transactionId);

        if (!pending) {
            return false;
        }

        return this.deletePending(storage, transactionId);
    }
}
