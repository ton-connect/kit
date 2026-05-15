/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SwapProviderInterface, StakingProviderInterface, StreamingProvider } from '@ton/walletkit';

/**
 * Available provider types in AppKit.
 */
export type AppKitProvider = SwapProviderInterface | StakingProviderInterface | StreamingProvider;
