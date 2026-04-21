/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    CryptoOnrampDeposit,
    CryptoOnrampDepositParams,
    CryptoOnrampQuote,
    CryptoOnrampQuoteParams,
} from '../../api/models';
import type { CryptoOnrampProviderInterface } from '../../api/interfaces';

/**
 * Abstract base class for crypto onramp providers
 *
 * Provides a common interface for implementing crypto-to-TON onramp functionality
 * across different gateways.
 *
 * @example
 * ```typescript
 * class MyCryptoOnrampProvider extends CryptoOnrampProvider {
 *   async getQuote(params: CryptoOnrampQuoteParams): Promise<CryptoOnrampQuote> {
 *     // Implementation
 *   }
 *
 *   async createDeposit(params: CryptoOnrampDepositParams): Promise<CryptoOnrampDeposit> {
 *     // Implementation
 *   }
 * }
 * ```
 */
export abstract class CryptoOnrampProvider<
    TQuoteOptions = undefined,
    TDepositOptions = undefined,
> implements CryptoOnrampProviderInterface<TQuoteOptions, TDepositOptions> {
    readonly type = 'crypto-onramp';
    abstract readonly providerId: string;

    /**
     * Get a quote for onramping from another crypto asset into a TON asset
     * @param params - Quote parameters
     * @returns Promise resolving to a crypto onramp quote with pricing information
     */
    abstract getQuote(params: CryptoOnrampQuoteParams<TQuoteOptions>): Promise<CryptoOnrampQuote>;

    /**
     * Create a deposit that the user must fund to complete the onramp
     * @param params - Deposit parameters including the quote and user TON address
     * @returns Promise resolving to deposit details (address, amount, memo, etc.)
     */
    abstract createDeposit(params: CryptoOnrampDepositParams<TDepositOptions>): Promise<CryptoOnrampDeposit>;
}
