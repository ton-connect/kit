/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { TransactionRequest, SendTransactionResponse } from '../../types/transaction';
import { getSelectedWallet } from '../wallets/get-selected-wallet';

/**
 * Parameters accepted by {@link sendTransaction} — same shape as {@link TransactionRequest}.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export type SendTransactionParameters = TransactionRequest;

/**
 * Return type of {@link sendTransaction}.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export type SendTransactionReturnType = SendTransactionResponse;

export type SendTransactionErrorType = Error;

/**
 * Hand a pre-built {@link TransactionRequest} to the selected wallet for signing and broadcast — usually the second step after {@link createTransferTonTransaction}, {@link buildSwapTransaction} or {@link buildStakeTransaction}. Throws `Error('Wallet not connected')` if no wallet is currently selected.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link SendTransactionParameters} Transaction request to broadcast.
 * @returns Wallet response carrying the BoC of the sent transaction.
 *
 * @sample docs/examples/src/appkit/actions/transaction#SEND_TRANSACTION
 *
 * @public
 * @category Action
 * @section Transactions
 */
export const sendTransaction = async (
    appKit: AppKit,
    parameters: SendTransactionParameters,
): Promise<SendTransactionReturnType> => {
    const wallet = getSelectedWallet(appKit);

    if (!wallet) {
        throw new Error('Wallet not connected');
    }

    return wallet.sendTransaction(parameters);
};
