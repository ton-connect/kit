/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network, BaseProvider } from '../models';

/**
 * Type of provider
 */
export type DefiProviderType = 'swap' | 'staking' | 'onramp' | 'crypto-onramp';

/**
 * Base interface for all DeFi providers
 */
export interface DefiProvider extends BaseProvider {
    /** Provider kind discriminator narrowed to the DeFi-domain literals so the right manager picks it up at registration time. */
    readonly type: DefiProviderType;

    /**
     * Networks this provider can operate on. Consumers should check before calling provider methods.
     * Implementations may return a static list or compute it dynamically (e.g. from runtime config).
     * @returns Array of networks supported by this provider
     */
    getSupportedNetworks(): Network[];
}
