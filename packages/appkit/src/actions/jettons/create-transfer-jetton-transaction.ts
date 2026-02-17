/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionRequest } from '@ton/walletkit';
import {
    createJettonTransferPayload,
    createTransferTransaction,
    getJettonWalletAddressFromClient,
    DEFAULT_JETTON_GAS_FEE,
} from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getSelectedWallet } from '../wallets/get-selected-wallet';
import { parseUnits } from '../../utils';

export interface CreateTransferJettonTransactionParameters {
    jettonAddress: string;
    recipientAddress: string;
    amount: string;
    jettonDecimals: number;
    comment?: string;
}

export type CreateTransferJettonTransactionReturnType = TransactionRequest;

/**
 * Create a Jetton transfer transaction request
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
