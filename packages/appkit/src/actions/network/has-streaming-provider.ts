/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit/services/app-kit';
import type { Network } from '../../types/network';

/**
 * Return type of {@link hasStreamingProvider}.
 *
 * @public
 * @category Type
 * @section Networks
 */
export type HasStreamingProviderReturnType = boolean;

/**
 * Check whether a streaming provider is registered for a network — required by {@link watchBalance}, {@link watchJettons} and other live-update actions.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param network - {@link Network} Network to check.
 * @returns `true` when a streaming provider is registered for that network.
 *
 * @sample docs/examples/src/appkit/actions/network#HAS_STREAMING_PROVIDER
 *
 * @public
 * @category Action
 * @section Networks
 */
export const hasStreamingProvider = (appKit: AppKit, network: Network): HasStreamingProviderReturnType => {
    return appKit.streamingManager.hasProvider(network);
};
