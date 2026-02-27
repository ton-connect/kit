/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OmnistonQuote } from './OmnistonQuote';

/**
 * Metadata associated with an Omniston quote
 */
export interface OmnistonQuoteMetadata {
    /**
     * The unique identifier of the quote
     */
    quoteId: string;

    /**
     * The unique identifier of the resolver
     */
    resolverId: string;

    /**
     * The name of the resolver
     */
    resolverName?: string;

    /**
     * The actual omniston quote object
     */
    omnistonQuote: OmnistonQuote;

    /**
     * The estimated gas budget required
     */
    gasBudget?: string;

    /**
     * The estimated gas consumption for the swap
     */
    estimatedGasConsumption?: string;
}
