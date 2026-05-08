/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SendTransactionResponse } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { createTransferTonTransaction } from './create-transfer-ton-transaction';
import type { CreateTransferTonTransactionParameters } from './create-transfer-ton-transaction';
import { sendTransaction } from './send-transaction';

export type TransferTonParameters = CreateTransferTonTransactionParameters;

export type TransferTonReturnType = SendTransactionResponse;

export type TransferTonErrorType = Error;

/**
 * Build and send a TON transfer from the selected wallet in one step (use `createTransferTonTransaction` + `sendTransaction` if you need to inspect the transaction first).
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - Recipient, amount and optional payload/comment.
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
