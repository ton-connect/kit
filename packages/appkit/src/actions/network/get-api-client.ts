/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '../../types/network';
import type { AppKit } from '../../core/app-kit';
import type { ApiClient } from '../../core/network';

/**
 * Return type of {@link getApiClient}.
 *
 * @public
 * @category Type
 * @section Client
 */
export type GetApiClientReturnType = ApiClient;

/**
 * Options for {@link getApiClient}.
 *
 * @public
 * @category Type
 * @section Client
 */
export type GetApiClientOptions = {
    /** Network whose configured {@link ApiClient} should be returned. */
    network: Network;
};

/**
 * Read the {@link ApiClient} configured for a specific {@link Network} — throws when the network has no client registered.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetApiClientOptions} Network to look up.
 * @returns The configured {@link ApiClient} for the requested network.
 *
 * @sample docs/examples/src/appkit/actions/network#GET_API_CLIENT
 * @expand options
 *
 * @public
 * @category Action
 * @section Client
 */
export const getApiClient = (appKit: AppKit, options: GetApiClientOptions): GetApiClientReturnType => {
    return appKit.networkManager.getClient(options.network);
};
