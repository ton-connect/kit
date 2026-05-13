/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { TransactionRequest, TransactionRequestMessage } from '../../types/transaction';
import type { Base64String, UserFriendlyAddress } from '../../types/primitives';
import { createCommentPayloadBase64, parseUnits } from '../../utils';
import { getSelectedWallet } from '../wallets/get-selected-wallet';

/**
 * Parameters accepted by {@link createTransferTonTransaction} and {@link transferTon}.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export interface CreateTransferTonTransactionParameters {
    /** Recipient address. */
    recipientAddress: UserFriendlyAddress;
    /** Amount in TON as a human-readable decimal string (e.g., `"1.5"`). Converted to nano-TON internally. */
    amount: string;
    /** Human-readable text comment. Converted to a Base64 payload when no `payload` is supplied. */
    comment?: string;
    /** Raw Base64 message payload — wins over `comment` when both are set. */
    payload?: Base64String;
    /** Initial state for deploying a new contract, encoded as Base64. */
    stateInit?: Base64String;
}

/**
 * Return type of {@link createTransferTonTransaction}.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export type CreateTransferTonTransactionReturnType = TransactionRequest;

/**
 * Build a TON transfer {@link TransactionRequest} for the selected wallet without sending it — useful when the UI needs to inspect or batch transactions before signing. Throws `Error('Wallet not connected')` if no wallet is currently selected.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link CreateTransferTonTransactionParameters} Recipient, amount and optional payload/comment/stateInit.
 * @returns Transaction request ready to pass to `sendTransaction`.
 *
 * @sample docs/examples/src/appkit/actions/transaction#CREATE_TRANSFER_TON_TRANSACTION
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Transactions
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
