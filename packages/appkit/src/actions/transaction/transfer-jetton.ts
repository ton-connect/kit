/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SendTransactionResponse } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { createTransferJettonTransaction } from './create-transfer-jetton-transaction';
import type { CreateTransferJettonTransactionParameters } from './create-transfer-jetton-transaction';
import { sendTransaction } from './send-transaction';

export type TransferJettonParameters = CreateTransferJettonTransactionParameters;

export type TransferJettonReturnType = SendTransactionResponse;

export type TransferJettonErrorType = Error;

/**
 * Transfer Jetton - creates and sends a Jetton transfer transaction
 */
export const transferJetton = async (
    appKit: AppKit,
    parameters: TransferJettonParameters,
): Promise<TransferJettonReturnType> => {
    const transaction = await createTransferJettonTransaction(appKit, parameters);

    return sendTransaction(appKit, transaction);
};
