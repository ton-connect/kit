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
import type { Base64String } from '../../types/primitives';
import { getDefaultNetwork } from '../network/get-default-network';

/**
 * Parameters accepted by {@link signBinary}.
 *
 * @public
 * @category Type
 * @section Signing
 */
export interface SignBinaryParameters {
    /** Binary blob the user is asked to sign, encoded as Base64. */
    bytes: Base64String;
    /** Network to issue the sign request against. Defaults to AppKit's configured default network; when none is set, the wallet falls back to its current network. */
    network?: Network;
}

/**
 * Return type of {@link signBinary}.
 *
 * @public
 * @category Type
 * @section Signing
 */
export type SignBinaryReturnType = SignDataResponse;

/**
 * Ask the selected wallet to sign a binary blob; throws `Error('Wallet not connected')` if no wallet is currently selected.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link SignBinaryParameters} Binary content and optional network override.
 * @returns Signature and signed payload, as returned by the wallet.
 *
 * @sample docs/examples/src/appkit/actions/signing#SIGN_BINARY
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Signing
 */
export const signBinary = async (appKit: AppKit, parameters: SignBinaryParameters): Promise<SignBinaryReturnType> => {
    const wallet = getSelectedWallet(appKit);

    if (!wallet) {
        throw new Error('Wallet not connected');
    }

    return await wallet.signData({
        network: parameters.network ?? getDefaultNetwork(appKit),
        data: {
            type: 'binary',
            value: { content: parameters.bytes },
        },
    });
};
