/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '@ton/walletkit';

import { getNetworks } from './get-networks';
import type { AppKit } from '../../core/app-kit';
import { NETWORKS_EVENTS } from '../../core/app-kit';

export type WatchNetworksParameters = {
    onChange: (networks: Network[]) => void;
};

export type WatchNetworksReturnType = () => void;

/**
 * Watch configured networks
 */
export const watchNetworks = (appKit: AppKit, parameters: WatchNetworksParameters): WatchNetworksReturnType => {
    const { onChange } = parameters;

    const unsubscribe = appKit.emitter.on(NETWORKS_EVENTS.UPDATED, () => {
        onChange(getNetworks(appKit));
    });

    return unsubscribe;
};
