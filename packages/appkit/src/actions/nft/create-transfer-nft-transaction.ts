/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionRequest } from '@ton/walletkit';
import { createNftTransferPayload, createTransferTransaction, DEFAULT_NFT_GAS_FEE } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getSelectedWallet } from '../wallets/get-selected-wallet';

export interface CreateTransferNftTransactionParameters {
    nftAddress: string;
    recipientAddress: string;
    amount?: string;
    comment?: string;
}

export type CreateTransferNftTransactionReturnType = TransactionRequest;

/**
 * Create an NFT transfer transaction request
 */
export const createTransferNftTransaction = async (
    appKit: AppKit,
    parameters: CreateTransferNftTransactionParameters,
): Promise<CreateTransferNftTransactionReturnType> => {
    const { nftAddress, recipientAddress, amount, comment } = parameters;

    const wallet = getSelectedWallet(appKit);

    if (!wallet) {
        throw new Error('Wallet not connected');
    }

    const payload = createNftTransferPayload({
        newOwner: recipientAddress,
        responseDestination: wallet.getAddress(),
        comment,
    });

    return createTransferTransaction({
        targetAddress: nftAddress,
        amount: amount ?? DEFAULT_NFT_GAS_FEE,
        payload,
        fromAddress: wallet.getAddress(),
    });
};
