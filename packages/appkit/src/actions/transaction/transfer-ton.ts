/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SendTransactionResponse, TONTransferRequest } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getSelectedWallet } from '../wallets/get-selected-wallet';

export type TransferTonParameters = TONTransferRequest & {
    /**
     * Optional message to attach to the transfer
     */
    comment?: string;
};

export type TransferTonReturnType = SendTransactionResponse;

export type TransferTonErrorType = Error;

/**
 * Transfer TON
 */
export async function transferTon(appKit: AppKit, parameters: TransferTonParameters): Promise<TransferTonReturnType> {
    const wallet = getSelectedWallet(appKit);

    if (!wallet) {
        throw new Error('Wallet not connected');
    }

    const transaction = await wallet.createTransferTonTransaction(parameters);

    return wallet.sendTransaction(transaction);
}
