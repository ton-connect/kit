/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '../../types/network';
import type { AppKit } from '../../core/app-kit';
import { getDefaultNetwork } from './get-default-network';
import { NETWORKS_EVENTS } from '../../core/app-kit';

/**
 * Parameters accepted by {@link watchDefaultNetwork}.
 *
 * @public
 * @category Type
 * @section Networks
 */
export type WatchDefaultNetworkParameters = {
    /** Callback fired whenever {@link setDefaultNetwork} updates the default — receives the new value (or `undefined` when cleared). */
    onChange: (network: Network | undefined) => void;
};

/**
 * Return type of {@link watchDefaultNetwork} — call to stop receiving updates.
 *
 * @public
 * @category Type
 * @section Networks
 */
export type WatchDefaultNetworkReturnType = () => void;

/**
 * Subscribe to default-network changes — fires when {@link setDefaultNetwork} is called.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link WatchDefaultNetworkParameters} Update callback.
 * @returns Unsubscribe function — call it to stop receiving updates.
 *
 * @sample docs/examples/src/appkit/actions/network#WATCH_DEFAULT_NETWORK
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Networks
 */
export const watchDefaultNetwork = (
    appKit: AppKit,
    parameters: WatchDefaultNetworkParameters,
): WatchDefaultNetworkReturnType => {
    const { onChange } = parameters;

    const unsubscribe = appKit.emitter.on(NETWORKS_EVENTS.DEFAULT_CHANGED, () => {
        onChange(getDefaultNetwork(appKit));
    });

    return unsubscribe;
};
