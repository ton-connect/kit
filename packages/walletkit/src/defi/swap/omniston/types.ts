/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Quote } from '@ston-fi/omniston-sdk';

interface ReferrerOptions {
    referrerAddress?: string;
    referrerFeeBps?: number;
    flexibleReferrerFee?: boolean;
}

export interface OmnistonSwapProviderConfig extends ReferrerOptions {
    apiUrl?: string;
    defaultSlippageBps?: number;
    quoteTimeoutMs?: number;
}

export interface OmnistonQuoteMetadata {
    quoteId: string;
    resolverId: string;
    resolverName?: string;
    omnistonQuote: Quote;
    gasBudget?: string;
    estimatedGasConsumption?: string;
}

/**
 * Provider-specific options for Omniston swap operations
 */
export type OmnistonProviderOptions = ReferrerOptions;
