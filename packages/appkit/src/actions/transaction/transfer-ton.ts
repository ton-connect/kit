/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { SendTransactionResponse } from '../../types/transaction';
import { createTransferTonTransaction } from './create-transfer-ton-transaction';
import type { CreateTransferTonTransactionParameters } from './create-transfer-ton-transaction';
import { sendTransaction } from './send-transaction';

/**
 * Parameters accepted by {@link transferTon} — same shape as {@link CreateTransferTonTransactionParameters}.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export type TransferTonParameters = CreateTransferTonTransactionParameters;

/**
 * Return type of {@link transferTon}.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export type TransferTonReturnType = SendTransactionResponse;

export type TransferTonErrorType = Error;

/**
 * Build and send a TON transfer from the selected wallet in one step (use {@link createTransferTonTransaction} + {@link sendTransaction} if you need to inspect the transaction first); throws `Error('Wallet not connected')` if no wallet is selected.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link TransferTonParameters} Recipient, amount and optional payload/comment/stateInit.
 * @returns Wallet response carrying the BoC of the sent transaction.
 *
 * @sample docs/examples/src/appkit/actions/transaction#TRANSFER_TON
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Transactions
 */
export const transferTon = async (
    appKit: AppKit,
    parameters: TransferTonParameters,
): Promise<TransferTonReturnType> => {
    const transaction = createTransferTonTransaction(appKit, parameters);

    return sendTransaction(appKit, transaction);
};
