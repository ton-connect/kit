/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionRequest, TransactionRequestMessage, Base64String } from '@ton/walletkit';
import { createCommentPayloadBase64 } from '@ton/walletkit';

import { parseUnits } from '../../utils';
import type { AppKit } from '../../core/app-kit';
import { getSelectedWallet } from '../wallets/get-selected-wallet';

export interface CreateTransferTonTransactionParameters {
    /** Recipient address */
    recipientAddress: string;
    /** Amount in TONs */
    amount: string;
    /** Human-readable text comment (will be converted to payload) */
    comment?: string;
    /** Message payload data encoded in Base64 (overrides comment if provided) */
    payload?: Base64String;
    /** Initial state for deploying a new contract, encoded in Base64 */
    stateInit?: Base64String;
}

export type CreateTransferTonTransactionReturnType = TransactionRequest;

/**
 * Create a TON transfer transaction request
 */
export const createTransferTonTransaction = (
    appKit: AppKit,
    parameters: CreateTransferTonTransactionParameters,
): CreateTransferTonTransactionReturnType => {
    const { recipientAddress, amount, comment, payload, stateInit } = parameters;

    const wallet = getSelectedWallet(appKit);

    if (!wallet) {
        throw new Error('Wallet not connected');
    }

    const message: TransactionRequestMessage = {
        address: recipientAddress,
        amount: parseUnits(amount, 9).toString(),
        stateInit,
    };

    // Payload takes priority, otherwise use comment
    if (payload) {
        message.payload = payload;
    } else if (comment) {
        message.payload = createCommentPayloadBase64(comment);
    }

    return {
        messages: [message],
        network: wallet.getNetwork(),
        fromAddress: wallet.getAddress(),
    };
};
