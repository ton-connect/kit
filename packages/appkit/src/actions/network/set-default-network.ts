/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '../../types/network';
import type { AppKit } from '../../core/app-kit';

/**
 * Parameters accepted by {@link setDefaultNetwork}.
 *
 * @public
 * @category Type
 * @section Networks
 */
export type SetDefaultNetworkParameters = {
    /** Network to enforce on new wallet connections; pass `undefined` to allow any registered network. */
    network: Network | undefined;
};

/**
 * Return type of {@link setDefaultNetwork}.
 *
 * @public
 * @category Type
 * @section Networks
 */
export type SetDefaultNetworkReturnType = void;

/**
 * Set or clear the default network — connectors enforce it on new wallet connections; emits `NETWORKS_EVENTS.DEFAULT_CHANGED` so {@link watchDefaultNetwork} subscribers fire. Pass `undefined` to remove the constraint and allow any registered network.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link SetDefaultNetworkParameters} Network to enforce, or `undefined` to clear.
 *
 * @sample docs/examples/src/appkit/actions/network#SET_DEFAULT_NETWORK
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Networks
 */
export const setDefaultNetwork = (
    appKit: AppKit,
    parameters: SetDefaultNetworkParameters,
): SetDefaultNetworkReturnType => {
    appKit.networkManager.setDefaultNetwork(parameters.network);
};
