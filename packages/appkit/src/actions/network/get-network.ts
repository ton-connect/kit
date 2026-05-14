/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '../../types/network';
import type { AppKit } from '../../core/app-kit';
import { getSelectedWallet } from '../wallets/get-selected-wallet';

/**
 * Return type of {@link getNetwork} — `null` when no wallet is currently selected.
 *
 * @public
 * @category Type
 * @section Networks
 */
export type GetNetworkReturnType = Network | null;

/**
 * Read the {@link Network} the selected wallet is connected to, or `null` when no wallet is selected (use {@link getDefaultNetwork} for AppKit's configured default).
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @returns Network of the selected wallet, or `null` when none is selected.
 *
 * @sample docs/examples/src/appkit/actions/network#GET_NETWORK
 *
 * @public
 * @category Action
 * @section Networks
 */
export const getNetwork = (appKit: AppKit): GetNetworkReturnType => {
    const wallet = getSelectedWallet(appKit);

    return wallet?.getNetwork() ?? null;
};
