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
 * Return type of {@link getDefaultNetwork} — `undefined` when no default has been set (apps may operate on any registered network).
 *
 * @public
 * @category Type
 * @section Networks
 */
export type GetDefaultNetworkReturnType = Network | undefined;

/**
 * Read AppKit's currently configured default network — the one connectors enforce on new wallet connections; `undefined` means any registered network is allowed.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @returns The default {@link Network}, or `undefined` if none is set.
 *
 * @sample docs/examples/src/appkit/actions/network#GET_DEFAULT_NETWORK
 *
 * @public
 * @category Action
 * @section Networks
 */
export const getDefaultNetwork = (appKit: AppKit): GetDefaultNetworkReturnType => {
    return appKit.networkManager.getDefaultNetwork();
};
