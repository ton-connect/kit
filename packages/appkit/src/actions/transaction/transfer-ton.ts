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
 * Transfer TON - creates and sends a TON transfer transaction
 */
export const transferTon = async (
    appKit: AppKit,
    parameters: TransferTonParameters,
): Promise<TransferTonReturnType> => {
    const transaction = createTransferTonTransaction(appKit, parameters);

    return sendTransaction(appKit, transaction);
};
