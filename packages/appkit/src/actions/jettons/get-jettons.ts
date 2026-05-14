/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { JettonsResponse } from '../../types/jetton';
import type { Network } from '../../types/network';
import { getSelectedWallet } from '../wallets/get-selected-wallet';
import { getJettonsByAddress } from './get-jettons-by-address';

/**
 * Options for {@link getJettons}.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export interface GetJettonsOptions {
    /** Network to read jettons from. Defaults to the selected wallet's network. */
    network?: Network;
    /** Maximum number of jettons to return. */
    limit?: number;
    /** Number of jettons to skip before returning results — used for pagination. */
    offset?: number;
}

/**
 * Return type of {@link getJettons} — `null` when no wallet is currently selected.
 *
 * @public
 * @category Type
 * @section Jettons
 */
export type GetJettonsReturnType = JettonsResponse | null;

/**
 * List jettons held by the currently selected wallet, returning `null` when no wallet is selected (use {@link getJettonsByAddress} for an arbitrary address).
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetJettonsOptions} Optional network override and pagination.
 * @returns Jettons response for the selected wallet, or `null` when none is selected.
 *
 * @sample docs/examples/src/appkit/actions/jettons#GET_JETTONS
 * @expand options
 *
 * @public
 * @category Action
 * @section Jettons
 */
export const getJettons = async (appKit: AppKit, options: GetJettonsOptions = {}): Promise<GetJettonsReturnType> => {
    const selectedWallet = getSelectedWallet(appKit);

    if (!selectedWallet) {
        return null;
    }

    return getJettonsByAddress(appKit, {
        address: selectedWallet.getAddress(),
        network: options.network,
        limit: options.limit,
        offset: options.offset,
    });
};
