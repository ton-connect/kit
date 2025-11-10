/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * transactions.ts – TON transaction operations
 *
 * Simplified bridge that passes requests directly to WalletKit.
 * All validation, transformation, and formatting happens in Kotlin.
 */

import type {
    GetRecentTransactionsArgs,
    CreateTransferTonTransactionArgs,
    CreateTransferMultiTonTransactionArgs,
    TransactionContentArgs,
} from '../types';
import { callBridge } from '../utils/bridgeWrapper';
import { walletKit } from '../core/state';
import { debugWarn } from '../utils/logger';

/**
 * Retrieves recent transactions for a wallet.
 * Returns raw WalletKit response - transformation happens in Kotlin TransactionResponseParser.
 */
export async function getRecentTransactions(args: GetRecentTransactionsArgs): Promise<{ items: unknown[] }> {
    return callBridge('getRecentTransactions', async () => {
        const wallet = walletKit.getWallet?.(args.address);
        if (!wallet) {
            throw new Error(`Wallet not found for address ${args.address}`);
        }

        const response = await wallet.client.getAccountTransactions({
            address: [args.address],
            limit: args.limit || 10,
        });

        return { items: response?.transactions || [] };
    });
}

/**
 * Creates a single-recipient TON transfer transaction.
 * Parameter validation and processing handled by Kotlin.
 */
export async function createTransferTonTransaction(args: CreateTransferTonTransactionArgs) {
    return callBridge('createTransferTonTransaction', async () => {
        const wallet = walletKit.getWallet?.(args.walletAddress);
        if (!wallet) {
            throw new Error(`Wallet not found for address ${args.walletAddress}`);
        }

        // Pass args directly - Kotlin TransactionOperations builds the proper structure
        const transaction = await wallet.createTransferTonTransaction(args);

        let preview: unknown = null;
        if (typeof wallet.getTransactionPreview === 'function') {
            try {
                const previewResult = await wallet.getTransactionPreview(transaction);
                preview = previewResult?.preview ?? previewResult;
            } catch (error) {
                debugWarn('[walletkitBridge] getTransactionPreview failed', error);
            }
        }

        return { transaction, preview };
    });
}

/**
 * Creates a multi-recipient TON transfer transaction.
 * Message validation and processing handled by Kotlin.
 */
export async function createTransferMultiTonTransaction(args: CreateTransferMultiTonTransactionArgs) {
    return callBridge('createTransferMultiTonTransaction', async () => {
        const wallet = walletKit.getWallet?.(args.walletAddress);
        if (!wallet) {
            throw new Error(`Wallet not found: ${args.walletAddress}`);
        }

        if (!Array.isArray(args.messages) || args.messages.length === 0) {
            throw new Error('At least one message required');
        }

        // Pass messages directly - Kotlin TransactionOperations builds the proper structure
        const transaction = await wallet.createTransferMultiTonTransaction(args);

        let preview: unknown = null;
        if (typeof wallet.getTransactionPreview === 'function') {
            try {
                const previewResult = await wallet.getTransactionPreview(transaction);
                preview = previewResult?.preview ?? previewResult;
            } catch (error) {
                debugWarn('[walletkitBridge] getTransactionPreview failed', error);
            }
        }

        return { transaction, preview };
    });
}

/**
 * Gets transaction preview (fee estimation).
 */
export async function getTransactionPreview(args: TransactionContentArgs) {
    return callBridge('getTransactionPreview', async () => {
        const wallet = walletKit.getWallet?.(args.walletAddress);
        if (!wallet) {
            throw new Error(`Wallet not found: ${args.walletAddress}`);
        }

        // Accept object directly (preferred) or parse string (legacy)
        const transaction =
            typeof args.transactionContent === 'string' ? JSON.parse(args.transactionContent) : args.transactionContent;
        const result = await wallet.getTransactionPreview(transaction);

        return result?.preview ?? result;
    });
}

/**
 * Handles new transaction (triggers confirmation flow).
 */
export async function handleNewTransaction(args: TransactionContentArgs) {
    return callBridge('handleNewTransaction', async () => {
        const wallet = walletKit.getWallet?.(args.walletAddress);
        if (!wallet) {
            throw new Error(`Wallet not found for address ${args.walletAddress}`);
        }

        const transaction =
            typeof args.transactionContent === 'string' ? JSON.parse(args.transactionContent) : args.transactionContent;

        await walletKit.handleNewTransaction(wallet, transaction);

        return { success: true };
    });
}

/**
 * Sends a transaction to the network.
 */
export async function sendTransaction(args: TransactionContentArgs) {
    return callBridge('sendTransaction', async () => {
        const wallet = walletKit.getWallet?.(args.walletAddress);
        if (!wallet) {
            throw new Error(`Wallet not found for address ${args.walletAddress}`);
        }

        // Accept object directly (preferred) or parse string (legacy)
        const transaction =
            typeof args.transactionContent === 'string' ? JSON.parse(args.transactionContent) : args.transactionContent;
        const result = await wallet.sendTransaction(transaction);

        return { signedBoc: result.signedBoc };
    });
}
