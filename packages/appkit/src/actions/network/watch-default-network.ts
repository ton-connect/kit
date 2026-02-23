/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { getDefaultNetwork } from './get-default-network';
import { NETWORKS_EVENTS } from '../../core/app-kit';

export type WatchDefaultNetworkParameters = {
    onChange: (network: Network | undefined) => void;
};

export type WatchDefaultNetworkReturnType = () => void;

/**
 * Watch default network changes
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
