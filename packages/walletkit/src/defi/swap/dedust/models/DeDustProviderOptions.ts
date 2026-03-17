/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DeDustReferralOptions } from './DeDustReferralOptions';

/**
 * Provider-specific options for DeDust swap operations
 */
export interface DeDustProviderOptions extends DeDustReferralOptions {
    /**
     * Protocols to use for routing
     * Available: 'dedust', 'dedust_v3', 'dedust_v3_memepad', 'stonfi_v1', 'stonfi_v2', 'tonco', 'memeslab', 'tonfun'
     * @default all protocols
     */
    protocols?: string[];

    /**
     * Protocols to exclude from routing
     */
    excludeProtocols?: string[];

    /**
     * Only use verified pools
     */
    onlyVerifiedPools?: boolean;

    /**
     * Maximum number of route splits
     * @format int
     */
    maxSplits?: number;

    /**
     * Maximum route length (hops)
     * @format int
     */
    maxLength?: number;

    /**
     * Exclude volatile pools
     */
    excludeVolatilePools?: boolean;
}
