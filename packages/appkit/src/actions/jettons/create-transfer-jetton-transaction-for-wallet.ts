/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    createJettonTransferPayload,
    createTransferTransaction,
    getJettonWalletAddressFromClient,
    DEFAULT_JETTON_GAS_FEE,
    parseUnits,
} from '@ton/walletkit';

import type { TransactionRequest } from '../../types/transaction';
import type { WalletInterface } from '../../types/wallet';
import type { AppKit } from '../../core/app-kit';

export interface CreateTransferJettonTransactionForWalletParameters {
    jettonAddress: string;
    recipientAddress: string;
    amount: string;
    jettonDecimals: number;
    comment?: string;
}

export type CreateTransferJettonTransactionForWalletReturnType = TransactionRequest;

/**
 * Create a Jetton transfer transaction request from a specific wallet
 * (bypasses the selected-wallet assumption used by `createTransferJettonTransaction`).
 */
export const createTransferJettonTransactionForWallet = async (
    appKit: AppKit,
    wallet: WalletInterface,
    parameters: CreateTransferJettonTransactionForWalletParameters,
): Promise<CreateTransferJettonTransactionForWalletReturnType> => {
    const { jettonAddress, recipientAddress, amount, jettonDecimals, comment } = parameters;

    const client = appKit.networkManager.getClient(wallet.getNetwork());

    const jettonWalletAddress = await getJettonWalletAddressFromClient(client, jettonAddress, wallet.getAddress());

    const jettonPayload = createJettonTransferPayload({
        amount: parseUnits(amount, jettonDecimals),
        destination: recipientAddress,
        responseDestination: wallet.getAddress(),
        comment,
    });

    return createTransferTransaction({
        targetAddress: jettonWalletAddress,
        amount: DEFAULT_JETTON_GAS_FEE,
        payload: jettonPayload,
        fromAddress: wallet.getAddress(),
    });
};
