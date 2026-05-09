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
import type { AppKit } from '../../core/app-kit';
import { getSelectedWallet } from '../wallets/get-selected-wallet';
import { getJettonInfo } from './get-jetton-info';
import { isNumber } from '../../utils';

export interface CreateTransferJettonTransactionParameters {
    jettonAddress: string;
    recipientAddress: string;
    amount: string;
    jettonDecimals?: number;
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
    const network = wallet.getNetwork();
    const client = appKit.networkManager.getClient(network);

    // Get jetton wallet address
    const ownerAddress = wallet.getAddress();
    const jettonWalletAddress = await getJettonWalletAddressFromClient(client, jettonAddress, ownerAddress);

    let decimals = jettonDecimals;

    if (!isNumber(decimals)) {
        const jettonInfo = await getJettonInfo(appKit, { address: jettonAddress, network });

        if (!isNumber(jettonInfo?.decimals)) {
            throw new Error(`Jetton decimals not found for address ${jettonAddress}`);
        }

        decimals = jettonInfo.decimals;
    }

    // Create jetton transfer payload
    const jettonPayload = createJettonTransferPayload({
        amount: parseUnits(amount, decimals),
        destination: recipientAddress,
        responseDestination: ownerAddress,
        comment,
    });

    // Build transaction
    return createTransferTransaction({
        targetAddress: jettonWalletAddress,
        amount: DEFAULT_JETTON_GAS_FEE,
        payload: jettonPayload,
        fromAddress: ownerAddress,
    });
};
