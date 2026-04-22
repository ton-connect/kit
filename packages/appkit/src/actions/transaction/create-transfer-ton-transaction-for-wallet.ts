/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createCommentPayloadBase64, parseUnits } from '@ton/walletkit';

import type { TransactionRequest, TransactionRequestMessage } from '../../types/transaction';
import type { Base64String } from '../../types/primitives';
import type { WalletInterface } from '../../types/wallet';

export interface CreateTransferTonTransactionForWalletParameters {
    /** Recipient address */
    recipientAddress: string;
    /** Amount in TONs */
    amount: string;
    /** Human-readable text comment (will be converted to payload) */
    comment?: string;
    /** Message payload data encoded in Base64 (overrides comment if provided) */
    payload?: string;
    /** Initial state for deploying a new contract, encoded in Base64 */
    stateInit?: string;
}

export type CreateTransferTonTransactionForWalletReturnType = TransactionRequest;

/**
 * Create a TON transfer transaction request from a specific wallet
 * (bypasses the selected-wallet assumption used by `createTransferTonTransaction`).
 */
export const createTransferTonTransactionForWallet = (
    wallet: WalletInterface,
    parameters: CreateTransferTonTransactionForWalletParameters,
): CreateTransferTonTransactionForWalletReturnType => {
    const { recipientAddress, amount, comment, payload, stateInit } = parameters;

    const message: TransactionRequestMessage = {
        address: recipientAddress,
        amount: parseUnits(amount, 9).toString(),
        stateInit: stateInit as Base64String,
    };

    if (payload) {
        message.payload = payload as Base64String;
    } else if (comment) {
        message.payload = createCommentPayloadBase64(comment) as Base64String;
    }

    return {
        messages: [message],
        network: wallet.getNetwork(),
        fromAddress: wallet.getAddress(),
    };
};
