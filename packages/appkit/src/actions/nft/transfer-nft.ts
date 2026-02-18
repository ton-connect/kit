/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SendTransactionResponse } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { createTransferNftTransaction } from './create-transfer-nft-transaction';
import type { CreateTransferNftTransactionParameters } from './create-transfer-nft-transaction';
import { sendTransaction } from '../transaction/send-transaction';

export type TransferNftParameters = CreateTransferNftTransactionParameters;

export type TransferNftReturnType = SendTransactionResponse;

/**
 * Transfer NFT to another wallet
 */
export const transferNft = async (
    appKit: AppKit,
    parameters: TransferNftParameters,
): Promise<TransferNftReturnType> => {
    const transaction = await createTransferNftTransaction(appKit, parameters);

    return sendTransaction(appKit, transaction);
};
