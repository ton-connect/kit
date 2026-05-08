/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { TransactionRequest } from '../../types/transaction';
import type { UserFriendlyAddress } from '../../types/primitives';
import { createNftTransferPayload, createTransferTransaction, DEFAULT_NFT_GAS_FEE } from '../../utils';
import { getSelectedWallet } from '../wallets/get-selected-wallet';

/**
 * Parameters accepted by {@link createTransferNftTransaction} and {@link transferNft}.
 *
 * @public
 * @category Type
 * @section NFTs
 */
export interface CreateTransferNftTransactionParameters {
    /** NFT contract address to transfer. */
    nftAddress: UserFriendlyAddress;
    /** New owner address. */
    recipientAddress: UserFriendlyAddress;
    /** Amount of TON to attach to the transfer for gas; defaults to AppKit's NFT gas-fee constant when omitted. */
    amount?: string;
    /** Optional human-readable comment attached to the transfer. */
    comment?: string;
}

/**
 * Return type of {@link createTransferNftTransaction}.
 *
 * @public
 * @category Type
 * @section NFTs
 */
export type CreateTransferNftTransactionReturnType = TransactionRequest;

/**
 * Build an NFT transfer {@link TransactionRequest} for the selected wallet without sending it — useful when the UI needs to inspect or batch transactions before signing; throws `Error('Wallet not connected')` when no wallet is selected.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link CreateTransferNftTransactionParameters} NFT, recipient, optional gas amount and comment.
 * @returns Transaction request ready to pass to `sendTransaction`.
 *
 * @sample docs/examples/src/appkit/actions/nft#CREATE_TRANSFER_NFT_TRANSACTION
 * @expand parameters
 *
 * @public
 * @category Action
 * @section NFTs
 */
export const createTransferNftTransaction = async (
    appKit: AppKit,
    parameters: CreateTransferNftTransactionParameters,
): Promise<CreateTransferNftTransactionReturnType> => {
    const { nftAddress, recipientAddress, amount, comment } = parameters;

    const wallet = getSelectedWallet(appKit);

    if (!wallet) {
        throw new Error('Wallet not connected');
    }

    const payload = createNftTransferPayload({
        newOwner: recipientAddress,
        responseDestination: wallet.getAddress(),
        comment,
    });

    return createTransferTransaction({
        targetAddress: nftAddress,
        amount: amount ?? DEFAULT_NFT_GAS_FEE,
        payload,
        fromAddress: wallet.getAddress(),
    });
};
