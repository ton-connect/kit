/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Quote } from '@ston-fi/omniston-sdk';

/**
 * Metadata associated with an Omniston quote
 */
export interface OmnistonQuoteMetadata {
    /**
     * The actual omniston quote object
     * @format unknown
     * @frozen
     */
    omnistonQuote: Quote;
}
