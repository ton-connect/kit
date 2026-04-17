/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionRequest } from '@ton/walletkit';

import { wallet, walletCall, clientCall, getKit, getWallet } from '../utils/bridge';

export const createTransferTonTransaction = (args: { walletId: string }) =>
    walletCall('createTransferTonTransaction', args);
export const createTransferMultiTonTransaction = (args: { walletId: string }) =>
    walletCall('createTransferMultiTonTransaction', args);
export const getTransactionPreview = (args: { walletId: string; transactionContent: TransactionRequest }) =>
    wallet(args.walletId, 'getTransactionPreview', args.transactionContent);
export const sendTransaction = (args: { walletId: string; transactionContent: TransactionRequest }) =>
    wallet(args.walletId, 'sendTransaction', args.transactionContent);
export const getRecentTransactions = (args: { walletId: string }) => clientCall('getAccountTransactions', args);

export async function handleNewTransaction(args: { walletId: string; transactionContent: TransactionRequest }) {
    const k = await getKit();
    const w = await getWallet(args.walletId);
    return k.handleNewTransaction(w, args.transactionContent);
}
