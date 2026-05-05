/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DeDustQuoteResponse } from '../DeDustPrivateTypes';

/**
 * Metadata stored in SwapQuote for DeDust provider
 */
export interface DeDustQuoteMetadata {
    /**
     * Raw quote response from API
     * @format frozen
     */
    quoteResponse: DeDustQuoteResponse;

    /**
     * Slippage used for the quote in basis points
     * @format int
     */
    slippageBps: number;
}
