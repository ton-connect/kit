/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';

export type SetDefaultNetworkParameters = {
    network: Network | undefined;
};

export type SetDefaultNetworkReturnType = void;

/**
 * Set the default network for wallet connections.
 * If set, connectors will enforce this network when connecting.
 * Set to `undefined` to allow any network.
 */
export const setDefaultNetwork = (
    appKit: AppKit,
    parameters: SetDefaultNetworkParameters,
): SetDefaultNetworkReturnType => {
    appKit.setDefaultNetwork(parameters.network);
};
