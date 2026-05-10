/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '../../types/network';
import type { AppKit } from '../../core/app-kit';
import type { SignDataResponse } from '../../types/signing';
import { getSelectedWallet } from '../wallets/get-selected-wallet';
import { getDefaultNetwork } from '../network/get-default-network';

/**
 * Parameters accepted by {@link signText}.
 *
 * @public
 * @category Type
 * @section Signing
 */
export interface SignTextParameters {
    /** UTF-8 text the user is asked to sign. */
    text: string;
    /** Network to issue the sign request against. Defaults to AppKit's configured default network; when none is set, the wallet falls back to its current network. */
    network?: Network;
}

/**
 * Return type of {@link signText}.
 *
 * @public
 * @category Type
 * @section Signing
 */
export type SignTextReturnType = SignDataResponse;

/**
 * Ask the selected wallet to sign a plain text message; throws `Error('Wallet not connected')` if no wallet is currently selected.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link SignTextParameters} Text to sign and optional network override.
 * @returns Signature and signed payload, as returned by the wallet.
 *
 * @sample docs/examples/src/appkit/actions/signing#SIGN_TEXT
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Signing
 */
export const signText = async (appKit: AppKit, parameters: SignTextParameters): Promise<SignTextReturnType> => {
    const wallet = getSelectedWallet(appKit);

    if (!wallet) {
        throw new Error('Wallet not connected');
    }

    return await wallet.signData({
        network: parameters.network ?? getDefaultNetwork(appKit),
        data: {
            type: 'text',
            value: { content: parameters.text },
        },
    });
};
