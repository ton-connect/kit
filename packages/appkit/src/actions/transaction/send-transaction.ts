/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SendTransactionResponse, TransactionRequest } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getSelectedWallet } from '../wallets/get-selected-wallet';

export type SendTransactionParameters = TransactionRequest;

export type SendTransactionReturnType = SendTransactionResponse;

export type SendTransactionErrorType = Error;

/**
 * Send transaction
 */
export async function sendTransaction(
    appKit: AppKit,
    parameters: SendTransactionParameters,
): Promise<SendTransactionReturnType> {
    const wallet = getSelectedWallet(appKit);

    if (!wallet) {
        throw new Error('Wallet not connected');
    }

    return wallet.sendTransaction(parameters);
}
