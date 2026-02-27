/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OmnistonReferrerOptions } from './OmnistonReferrerOptions';

/**
 * Configuration for the Omniston Swap Provider
 */
export interface OmnistonSwapProviderConfig extends OmnistonReferrerOptions {
    /**
     * Optional URL for the Omniston API
     */
    apiUrl?: string;

    /**
     * Default slippage tolerance in basis points (1 bp = 0.01%)
     * @format int
     */
    defaultSlippageBps?: number;

    /**
     * Timeout for quote requests in milliseconds
     * @format int
     */
    quoteTimeoutMs?: number;

    /**
     * Identifier for the provider
     */
    providerId?: string;
}
