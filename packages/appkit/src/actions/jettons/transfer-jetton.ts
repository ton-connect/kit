/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { SendTransactionResponse } from '../../types/transaction';
import { sendTransaction } from '../transaction/send-transaction';
import { createTransferJettonTransaction } from './create-transfer-jetton-transaction';
import type { CreateTransferJettonTransactionParameters } from './create-transfer-jetton-transaction';

/**
 * Parameters accepted by {@link transferJetton} — same shape as {@link CreateTransferJettonTransactionParameters}.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type TransferJettonParameters = CreateTransferJettonTransactionParameters;

/**
 * Return type of {@link transferJetton}.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type TransferJettonReturnType = SendTransactionResponse;

export type TransferJettonErrorType = Error;

/**
 * Build and send a jetton transfer from the selected wallet in one step (use {@link createTransferJettonTransaction} + {@link sendTransaction} if you need to inspect the transaction first); throws `Error('Wallet not connected')` if no wallet is currently selected.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link TransferJettonParameters} Jetton, recipient, amount, decimals and optional comment.
 * @returns Wallet response carrying the BoC of the sent transaction.
 *
 * @sample docs/examples/src/appkit/actions/jettons#TRANSFER_JETTON
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Jettons
 */
export const transferJetton = async (
    appKit: AppKit,
    parameters: TransferJettonParameters,
): Promise<TransferJettonReturnType> => {
    const transaction = await createTransferJettonTransaction(appKit, parameters);

    return sendTransaction(appKit, transaction);
};
