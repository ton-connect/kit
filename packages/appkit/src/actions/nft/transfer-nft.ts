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
import { createTransferNftTransaction } from './create-transfer-nft-transaction';
import type { CreateTransferNftTransactionParameters } from './create-transfer-nft-transaction';

/**
 * Parameters accepted by {@link transferNft} — same shape as {@link CreateTransferNftTransactionParameters}.
 *
 * @public
 * @category Type
 * @section NFTs
 */
export type TransferNftParameters = CreateTransferNftTransactionParameters;

/**
 * Return type of {@link transferNft}.
 *
 * @public
 * @category Type
 * @section NFTs
 */
export type TransferNftReturnType = SendTransactionResponse;

/**
 * Build and send an NFT transfer from the selected wallet in one step (use {@link createTransferNftTransaction} + `sendTransaction` if you need to inspect the transaction first); throws `Error('Wallet not connected')` when no wallet is selected.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link TransferNftParameters} NFT, recipient, optional gas amount and comment.
 * @returns Wallet response carrying the BoC of the sent transaction.
 *
 * @sample docs/examples/src/appkit/actions/nft#TRANSFER_NFT
 * @expand parameters
 *
 * @public
 * @category Action
 * @section NFTs
 */
export const transferNft = async (
    appKit: AppKit,
    parameters: TransferNftParameters,
): Promise<TransferNftReturnType> => {
    const transaction = await createTransferNftTransaction(appKit, parameters);

    return sendTransaction(appKit, transaction);
};
