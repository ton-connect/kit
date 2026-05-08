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
 * Parameters accepted by {@link signCell}.
 *
 * @public
 * @category Type
 * @section Signing
 */
export interface SignCellParameters {
    /** TON cell content encoded as Base64 (BoC). */
    cell: Base64String;
    /** TL-B-style schema describing the cell layout so the wallet can render the payload to the user. */
    schema: string;
    /** Network to issue the sign request against. Defaults to AppKit's configured default network. */
    network?: Network;
}

/**
 * Return type of {@link signCell}.
 *
 * @public
 * @category Type
 * @section Signing
 */
export type SignCellReturnType = SignDataResponse;

/**
 * Ask the connected wallet to sign a TON cell — typically used so the signature can later be verified on-chain; throws `Error('Wallet not connected')` if no wallet is currently selected.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link SignCellParameters} Cell content, TL-B schema and optional network override.
 * @returns Signature and signed payload, as returned by the wallet.
 *
 * @sample docs/examples/src/appkit/actions/signing#SIGN_CELL
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Signing
 */
export const signCell = async (appKit: AppKit, parameters: SignCellParameters): Promise<SignCellReturnType> => {
    const wallet = getSelectedWallet(appKit);

    if (!wallet) {
        throw new Error('Wallet not connected');
    }

    return await wallet.signData({
        network: parameters.network ?? getDefaultNetwork(appKit),
        data: {
            type: 'cell',
            value: {
                content: parameters.cell,
                schema: parameters.schema,
            },
        },
    });
};
