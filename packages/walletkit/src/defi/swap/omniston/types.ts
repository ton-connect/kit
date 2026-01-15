/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Quote } from '@ston-fi/omniston-sdk';

export interface OmnistonQuoteMetadata {
    quoteId: string;
    resolverId: string;
    resolverName?: string;
    omnistonQuote: Quote;
    gasBudget?: string;
    estimatedGasConsumption?: string;
}
