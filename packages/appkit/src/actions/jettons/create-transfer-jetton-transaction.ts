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
import {
    createJettonTransferPayload,
    createTransferTransaction,
    getJettonWalletAddressFromClient,
    DEFAULT_JETTON_GAS_FEE,
    parseUnits,
} from '../../utils';
import { getSelectedWallet } from '../wallets/get-selected-wallet';

/**
 * Parameters accepted by {@link createTransferJettonTransaction} and {@link transferJetton}.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export interface CreateTransferJettonTransactionParameters {
    /** Jetton master contract address being transferred. */
    jettonAddress: UserFriendlyAddress;
    /** Recipient who should receive the jettons. */
    recipientAddress: UserFriendlyAddress;
    /** Amount in jetton units as a human-readable decimal string (e.g., `"1.5"`). */
    amount: string;
    /** Decimals declared by the jetton master. Used to convert `amount` into raw smallest units. */
    jettonDecimals: number;
    /** Optional human-readable comment attached to the transfer. */
    comment?: string;
}

/**
 * Return type of {@link createTransferJettonTransaction}.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type CreateTransferJettonTransactionReturnType = TransactionRequest;

/**
 * Build a jetton transfer {@link TransactionRequest} for the selected wallet without sending it — useful when the UI needs to inspect or batch transactions before signing. Throws `Error('Wallet not connected')` if no wallet is currently selected.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link CreateTransferJettonTransactionParameters} Jetton, recipient, amount, decimals and optional comment.
 * @returns Transaction request ready to pass to `sendTransaction`.
 *
 * @sample docs/examples/src/appkit/actions/jettons#CREATE_TRANSFER_JETTON_TRANSACTION
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Jettons
 */
export const createTransferJettonTransaction = async (
    appKit: AppKit,
    parameters: CreateTransferJettonTransactionParameters,
): Promise<CreateTransferJettonTransactionReturnType> => {
    const { jettonAddress, recipientAddress, amount, jettonDecimals, comment } = parameters;

    const wallet = getSelectedWallet(appKit);

    if (!wallet) {
        throw new Error('Wallet not connected');
    }

    // Get client from network manager
    const client = appKit.networkManager.getClient(wallet.getNetwork());

    // Get jetton wallet address
    const jettonWalletAddress = await getJettonWalletAddressFromClient(client, jettonAddress, wallet.getAddress());

    // Create jetton transfer payload
    const jettonPayload = createJettonTransferPayload({
        amount: parseUnits(amount, jettonDecimals),
        destination: recipientAddress,
        responseDestination: wallet.getAddress(),
        comment,
    });

    // Build transaction
    return createTransferTransaction({
        targetAddress: jettonWalletAddress,
        amount: DEFAULT_JETTON_GAS_FEE,
        payload: jettonPayload,
        fromAddress: wallet.getAddress(),
    });
};
