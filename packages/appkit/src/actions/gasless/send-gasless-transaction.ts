/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TokenAmount } from '@ton/walletkit';

import type { Base64String } from '../../types/primitives';
import type { TransactionRequestMessage } from '../../types/transaction';
import type { AppKit } from '../../core/app-kit';
import { getSelectedWallet } from '../wallets/get-selected-wallet';

export interface SendGaslessTransactionParameters {
    /** Master address of the jetton used to pay the relayer's fee */
    feeJettonMaster: string;
    /** User's messages to include in the gasless transaction */
    messages: TransactionRequestMessage[];
    /** Gasless provider id. Uses the default provider when omitted. */
    providerId?: string;
}

export interface SendGaslessTransactionReturnType {
    /** Signed internal BoC that was submitted to the relayer */
    internalBoc: Base64String;
    /** Relayer fee in fee-jetton nanounits */
    fee: TokenAmount;
}

export type SendGaslessTransactionErrorType = Error;

/**
 * Execute a full gasless transaction flow:
 *   1. estimate (with the relayer)
 *   2. sign the relayer-wrapped messages via the wallet's `signMessage`
 *   3. submit the signed BoC to the relayer
 *
 * Requires the wallet to support the SignMessage feature.
 */
export const sendGaslessTransaction = async (
    appKit: AppKit,
    parameters: SendGaslessTransactionParameters,
): Promise<SendGaslessTransactionReturnType> => {
    const wallet = getSelectedWallet(appKit);

    if (!wallet) {
        throw new Error('Wallet not connected');
    }

    const walletPublicKey = wallet.getPublicKey();

    const estimate = await appKit.gaslessManager.estimate(
        {
            feeJettonMaster: parameters.feeJettonMaster,
            walletAddress: wallet.getAddress(),
            walletPublicKey,
            messages: parameters.messages,
        },
        parameters.providerId,
    );

    const { internalBoc } = await wallet.signMessage({
        messages: estimate.messages,
        validUntil: estimate.validUntil,
    });

    await appKit.gaslessManager.send(
        {
            walletPublicKey,
            internalBoc,
        },
        parameters.providerId,
    );

    return {
        internalBoc,
        fee: estimate.fee,
    };
};
