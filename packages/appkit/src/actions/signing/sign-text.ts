/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import type { SignDataResponse } from '../../types/signing';
import { getSelectedWallet } from '../wallets/get-selected-wallet';

export interface SignTextParameters {
    /** Text message to sign */
    text: string;
    /** Optional network (mainnet/testnet) */
    network?: Network;
}

export type SignTextReturnType = SignDataResponse;

/**
 * Sign a text message with the connected wallet.
 *
 * @example
 * ```ts
 * const result = await signText(appKit, { text: "Hello World" });
 * console.log(result.signature);
 * ```
 */
export const signText = async (appKit: AppKit, parameters: SignTextParameters): Promise<SignTextReturnType> => {
    const wallet = getSelectedWallet(appKit);

    if (!wallet) {
        throw new Error('No wallet connected');
    }

    return await wallet.signData({
        network: parameters.network,
        data: {
            type: 'text',
            value: { content: parameters.text },
        },
    });
};
