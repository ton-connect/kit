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
 * Return type of {@link getNetworks}.
 *
 * @public
 * @category Type
 * @section Networks
 */
export type GetNetworksReturnType = Network[];

/**
 * List every network configured on this AppKit instance via {@link AppKitConfig}`.networks`.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @returns Array of configured {@link Network}s.
 *
 * @sample docs/examples/src/appkit/actions/network#GET_NETWORKS
 *
 * @public
 * @category Action
 * @section Networks
 */
export const getNetworks = (appKit: AppKit): GetNetworksReturnType => {
    return appKit.networkManager.getConfiguredNetworks();
};
