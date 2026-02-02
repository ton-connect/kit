/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * jettons.ts – Jetton operations
 *
 * Simplified bridge for jetton balance queries and transfer transactions.
 */

import type { JettonsResponse, TransactionRequest, TransactionEmulatedPreview } from '@ton/walletkit';

import type {
    GetJettonsArgs,
    CreateTransferJettonTransactionArgs,
    GetJettonBalanceArgs,
    GetJettonWalletAddressArgs,
} from '../types';
import { callBridge, callOnWalletBridge } from '../utils/bridgeWrapper';

/**
 * Fetches jetton balances for a wallet with optional pagination.
 */
export async function getJettons(args: GetJettonsArgs): Promise<JettonsResponse> {
    return callBridge('getJettons', async () => {
        return await callOnWalletBridge<JettonsResponse>(args.walletId, 'getJettons', {
            pagination: args.pagination,
        });
    });
}

type JettonTransactionResult = { transaction: TransactionRequest; preview?: TransactionEmulatedPreview };

/**
 * Builds a jetton transfer transaction.
 */
export async function createTransferJettonTransaction(
    args: CreateTransferJettonTransactionArgs,
): Promise<JettonTransactionResult> {
    return callBridge('createTransferJettonTransaction', async () => {
        return await callOnWalletBridge<JettonTransactionResult>(args.walletId, 'createTransferJettonTransaction', {
            jettonAddress: args.jettonAddress,
            amount: args.amount,
            toAddress: args.toAddress,
            comment: args.comment,
        });
    });
}

/**
 * Retrieves a jetton balance for the specified wallet.
 */
export async function getJettonBalance(args: GetJettonBalanceArgs): Promise<string> {
    return callBridge('getJettonBalance', async () => {
        return await callOnWalletBridge<string>(args.walletId, 'getJettonBalance', args.jettonAddress);
    });
}

/**
 * Resolves the jetton wallet address for a specific jetton contract.
 */
export async function getJettonWalletAddress(args: GetJettonWalletAddressArgs): Promise<string> {
    return callBridge('getJettonWalletAddress', async () => {
        return await callOnWalletBridge<string>(args.walletId, 'getJettonWalletAddress', args.jettonAddress);
    });
}
