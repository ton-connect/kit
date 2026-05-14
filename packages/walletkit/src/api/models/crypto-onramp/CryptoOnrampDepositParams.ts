/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CryptoOnrampQuote } from './CryptoOnrampQuote';

/**
 * Parameters for creating a crypto onramp deposit.
 *
 * The recipient is taken from `quote.recipientAddress` set at quote time.
 */
export interface CryptoOnrampDepositParams<TQuoteMetadata = unknown, TProviderOptions = unknown> {
    /**
     * Quote to execute the deposit against (contains recipientAddress and provider metadata)
     */
    quote: CryptoOnrampQuote<TQuoteMetadata>;

    /**
     * Address to refund the crypto to in case of failure
     */
    refundAddress: string;

    /**
     * Provider-specific options
     */
    providerOptions?: TProviderOptions;
}
