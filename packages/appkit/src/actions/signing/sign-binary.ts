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
import type { Base64String } from '../../types/primitives';

export interface SignBinaryParameters {
    /** Binary data to sign (base64 encoded) */
    bytes: Base64String;
    /** Optional network (mainnet/testnet) */
    network?: Network;
}

export type SignBinaryReturnType = SignDataResponse;

/**
 * Sign binary data with the connected wallet.
 *
 * @example
 * ```ts
 * const result = await signBinary(appKit, { bytes: btoa("binary data") });
 * console.log(result.signature);
 * ```
 */
export const signBinary = async (appKit: AppKit, parameters: SignBinaryParameters): Promise<SignBinaryReturnType> => {
    const wallet = getSelectedWallet(appKit);

    if (!wallet) {
        throw new Error('No wallet connected');
    }

    return await wallet.signData({
        network: parameters.network,
        data: {
            type: 'binary',
            value: { content: parameters.bytes },
        },
    });
};
