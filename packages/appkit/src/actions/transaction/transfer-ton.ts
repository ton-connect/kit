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
 * Send a TON transfer from the selected wallet.
 *
 * Builds a transfer transaction and sends it through the connected wallet
 * in one step. If you need to inspect or sign the transaction before
 * sending, use `createTransferTonTransaction` and `sendTransaction`
 * separately.
 *
 * @param appKit - AppKit runtime instance.
 * @param parameters - Recipient, amount and optional payload/comment.
 * @returns Wallet response carrying the BoC of the sent transaction.
 *
 * @sample docs/examples/src/appkit/actions/transaction#TRANSFER_TON
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
