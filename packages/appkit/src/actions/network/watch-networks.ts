/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '../../types/network';
import { getNetworks } from './get-networks';
import type { AppKit } from '../../core/app-kit';
import { NETWORKS_EVENTS } from '../../core/app-kit';

/**
 * Parameters accepted by {@link watchNetworks}.
 *
 * @public
 * @category Type
 * @section Networks
 */
export type WatchNetworksParameters = {
    /** Callback fired whenever the configured-networks list changes — receives the latest snapshot. */
    onChange: (networks: Network[]) => void;
};

/**
 * Return type of {@link watchNetworks} — call to stop receiving updates.
 *
 * @public
 * @category Type
 * @section Networks
 */
export type WatchNetworksReturnType = () => void;

/**
 * Subscribe to changes of the configured-networks list — fires when AppKit's network manager registers, replaces or drops a network's API client.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param parameters - {@link WatchNetworksParameters} Update callback.
 * @returns Unsubscribe function — call it to stop receiving updates.
 *
 * @sample docs/examples/src/appkit/actions/network#WATCH_NETWORKS
 * @expand parameters
 *
 * @public
 * @category Action
 * @section Networks
 */
export const watchNetworks = (appKit: AppKit, parameters: WatchNetworksParameters): WatchNetworksReturnType => {
    const { onChange } = parameters;

    const unsubscribe = appKit.emitter.on(NETWORKS_EVENTS.UPDATED, () => {
        onChange(getNetworks(appKit));
    });

    return unsubscribe;
};
