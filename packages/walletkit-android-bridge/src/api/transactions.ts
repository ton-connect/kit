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

import type { Transaction } from '@ton/walletkit';

import type {
    GetRecentTransactionsArgs,
    CreateTransferTonTransactionArgs,
    CreateTransferMultiTonTransactionArgs,
    TransactionContentArgs,
} from '../types';
import { callBridge } from '../utils/bridgeWrapper';
import { warn } from '../utils/logger';

/**
 * Retrieves recent transactions for a wallet.
 * Returns raw WalletKit response - transformation happens in Kotlin TransactionResponseParser.
 */
export async function getRecentTransactions(args: GetRecentTransactionsArgs): Promise<Transaction[]> {
    return callBridge('getRecentTransactions', async (kit) => {
        const wallet = kit.getWallet?.(args.walletId);

        // Extract address from walletId (format: "{chainId}:{address}")
        const address = wallet?.getAddress?.() ?? args.walletId.split(':')[1];

        const response = await wallet!.getClient().getAccountTransactions({
            address: [address],
            limit: args.limit || 10,
        });

        return response?.transactions || [];
    });
}

/**
 * Creates a single-recipient TON transfer transaction.
 * Returns raw transaction and optional preview - Kotlin handles structure.
 */
export async function createTransferTonTransaction(args: CreateTransferTonTransactionArgs) {
    return callBridge('createTransferTonTransaction', async (kit) => {
        const wallet = kit.getWallet?.(args.walletId);
        if (!wallet) {
            throw new Error(`Wallet not found: ${args.walletId}`);
        }

        // Map from bridge args to walletkit's TONTransferRequest
        const transaction = await wallet.createTransferTonTransaction({
            transferAmount: args.amount,
            recipientAddress: args.toAddress,
            comment: args.comment,
            body: args.body,
            stateInit: args.stateInit,
        } as Parameters<typeof wallet.createTransferTonTransaction>[0]);

        if (wallet.getTransactionPreview) {
            try {
                const preview = await wallet.getTransactionPreview(transaction);
                return { transaction, preview };
            } catch (err) {
                warn('[walletkitBridge] getTransactionPreview failed', err);
            }
        }

        return { transaction };
    });
}

/**
 * Creates a multi-recipient TON transfer transaction.
 * Returns raw transaction and optional preview - Kotlin handles structure.
 */
export async function createTransferMultiTonTransaction(args: CreateTransferMultiTonTransactionArgs) {
    return callBridge('createTransferMultiTonTransaction', async (kit) => {
        const wallet = kit.getWallet?.(args.walletId);
        if (!wallet) {
            throw new Error(`Wallet not found: ${args.walletId}`);
        }

        // Map from bridge args to walletkit's TONTransferRequest[]
        const requests = args.messages.map((msg) => ({
            transferAmount: msg.amount,
            recipientAddress: msg.toAddress,
            comment: msg.comment,
            body: msg.body,
            stateInit: msg.stateInit,
        }));

        // Cast to expected type - implementation accepts TONTransferRequest[]
        const transaction = await wallet.createTransferMultiTonTransaction(
            requests as unknown as Parameters<typeof wallet.createTransferMultiTonTransaction>[0],
        );

        if (wallet.getTransactionPreview) {
            try {
                const preview = await wallet.getTransactionPreview(transaction);
                return { transaction, preview };
            } catch (err) {
                warn('[walletkitBridge] getTransactionPreview failed', err);
            }
        }

        return { transaction };
    });
}

/**
 * Gets transaction preview (fee estimation).
 */
export async function getTransactionPreview(args: TransactionContentArgs) {
    return callBridge('getTransactionPreview', async (kit) => {
        const wallet = kit.getWallet?.(args.walletId);
        if (!wallet) {
            throw new Error(`Wallet not found: ${args.walletId}`);
        }

        // Accept object directly (preferred) or parse string (legacy)
        const transaction =
            typeof args.transactionContent === 'string' ? JSON.parse(args.transactionContent) : args.transactionContent;

        if (!wallet.getTransactionPreview) {
            throw new Error('getTransactionPreview not available on wallet');
        }
        return await wallet.getTransactionPreview(transaction);
    });
}

/**
 * Handles new transaction (triggers confirmation flow).
 */
export async function handleNewTransaction(args: TransactionContentArgs) {
    return callBridge('handleNewTransaction', async (kit) => {
        const wallet = kit.getWallet?.(args.walletId);
        if (!wallet) {
            throw new Error(`Wallet not found: ${args.walletId}`);
        }

        const transaction =
            typeof args.transactionContent === 'string' ? JSON.parse(args.transactionContent) : args.transactionContent;

        await kit.handleNewTransaction(wallet, transaction);

        return { success: true };
    });
}

/**
 * Sends a transaction to the network.
 * Returns raw result object with signedBoc.
 */
export async function sendTransaction(args: TransactionContentArgs) {
    return callBridge('sendTransaction', async (kit) => {
        const wallet = kit.getWallet?.(args.walletId);
        if (!wallet) {
            throw new Error(`Wallet not found: ${args.walletId}`);
        }

        const transaction =
            typeof args.transactionContent === 'string' ? JSON.parse(args.transactionContent) : args.transactionContent;
        return await wallet.sendTransaction(transaction);
    });
}
