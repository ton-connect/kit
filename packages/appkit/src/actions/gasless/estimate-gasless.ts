/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { GaslessEstimateResult } from '@ton/walletkit';

import type { TransactionRequestMessage } from '../../types/transaction';
import type { AppKit } from '../../core/app-kit';
import { getSelectedWallet } from '../wallets/get-selected-wallet';

export interface EstimateGaslessParameters {
    /** Master address of the jetton used to pay the relayer's fee */
    feeJettonMaster: string;
    /** User's messages to include in the gasless transaction */
    messages: TransactionRequestMessage[];
    /** Gasless provider id. Uses the default provider when omitted. */
    providerId?: string;
}

export type EstimateGaslessReturnType = Promise<GaslessEstimateResult>;

export type EstimateGaslessErrorType = Error;

/**
 * Ask the relayer to estimate a gasless transaction.
 *
 * Returns relayer-wrapped messages (ready to be signed via `signMessage`), the
 * commission charged in the fee jetton, and the bundle validity window.
 */
export const estimateGasless = async (
    appKit: AppKit,
    parameters: EstimateGaslessParameters,
): EstimateGaslessReturnType => {
    const wallet = getSelectedWallet(appKit);

    if (!wallet) {
        throw new Error('Wallet not connected');
    }

    return appKit.gaslessManager.estimate(
        {
            feeJettonMaster: parameters.feeJettonMaster,
            walletAddress: wallet.getAddress(),
            walletPublicKey: wallet.getPublicKey(),
            messages: parameters.messages,
        },
        parameters.providerId,
    );
};
