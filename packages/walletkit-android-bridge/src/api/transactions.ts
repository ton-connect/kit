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
 * Minimal bridge - just forwards calls to WalletKit.
 */

import type { TransactionRequest } from '@ton/walletkit';

import { walletCall, clientCall, getKit, getWallet } from '../utils/bridge';

export const createTransferTonTransaction = (args: { walletId: string }) =>
    walletCall('createTransferTonTransaction', args);
export const createTransferMultiTonTransaction = (args: { walletId: string }) =>
    walletCall('createTransferMultiTonTransaction', args);
export const getTransactionPreview = (args: { walletId: string }) => walletCall('getTransactionPreview', args);
export const sendTransaction = (args: { walletId: string }) => walletCall('sendTransaction', args);
export const getRecentTransactions = (args: { walletId: string }) => clientCall('getAccountTransactions', args);

export async function handleNewTransaction(args: [string, unknown]) {
    const k = await getKit();
    const w = await getWallet(args[0]);
    return k.handleNewTransaction(w, args[1] as TransactionRequest);
}
