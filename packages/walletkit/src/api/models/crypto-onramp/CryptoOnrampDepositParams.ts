/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../core/Primitives';
import type { CryptoOnrampQuote } from './CryptoOnrampQuote';

/**
 * Parameters for creating a crypto onramp deposit
 */
export interface CryptoOnrampDepositParams<TQuoteMetadata = unknown, TProviderOptions = unknown> {
    /**
     * Quote to execute the deposit against
     */
    quote: CryptoOnrampQuote<TQuoteMetadata>;

    /**
     * TON address of the user that will receive the target crypto
     */
    userAddress: UserFriendlyAddress;

    /**
     * Address to refund the crypto to in case of failure
     */
    refundAddress: string;

    /**
     * Provider-specific options
     */
    providerOptions?: TProviderOptions;
}
