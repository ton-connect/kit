/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit/services/app-kit';
import type { Network } from '../../types/network';

export type HasStreamingProviderReturnType = boolean;

/**
 * Check if a streaming provider is registered for a specific network.
 */
export const hasStreamingProvider = (appKit: AppKit, network: Network): HasStreamingProviderReturnType => {
    return appKit.streamingManager.hasProvider(network);
};
