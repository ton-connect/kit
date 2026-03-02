/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    OnrampParams,
    OnrampQuote,
    OnrampQuoteParams,
    OnrampLimits,
    OnrampLimitParams,
    OnrampTransactionStatus,
    OnrampTransactionParams,
} from '../../api/models/onramps';
import type { OnrampProviderInterface } from '../../api/interfaces';

/**
 * Abstract base class for onramp providers
 *
 * Provides a common interface for implementing fiat-to-crypto onramp functionality
 * across different gateways.
 *
 * @example
 * ```typescript
 * class MyOnrampProvider extends OnrampProvider {
 *   async getQuote(params: OnrampQuoteParams): Promise<OnrampQuote> {
 *     // Implementation
 *   }
 *
 *   async buildOnrampUrl(params: OnrampParams): Promise<string> {
 *     // Implementation
 *   }
 * }
 * ```
 */
export abstract class OnrampProvider<
    TQuoteOptions = undefined,
    TOnrampOptions = undefined,
    TLimitOptions = undefined,
    TTransactionOptions = undefined,
> implements OnrampProviderInterface<TQuoteOptions, TOnrampOptions, TLimitOptions, TTransactionOptions>
{
    readonly type = 'onramp';
    abstract readonly providerId: string;

    /**
     * Get a quote for onramping fiat to crypto
     * @param params - Quote parameters including currencies and amount
     * @returns Promise resolving to onramp quote with pricing information
     */
    abstract getQuote(params: OnrampQuoteParams<TQuoteOptions>): Promise<OnrampQuote>;

    /**
     * Get trading limits for the provider
     * @param params - Parameters specifying the desired currencies
     * @returns Promise resolving to the allowed onramp limits
     */
    abstract getLimits(params: OnrampLimitParams<TLimitOptions>): Promise<OnrampLimits>;

    /**
     * Get the status of a specific onramp transaction
     * @param params - Parameters including the transaction ID
     * @returns Promise resolving to the current transaction status
     */
    abstract getTransactionStatus(
        params: OnrampTransactionParams<TTransactionOptions>,
    ): Promise<OnrampTransactionStatus>;

    /**
     * Build an onramp URL for redirecting the user to the provider
     * @param params - Onramp parameters including quote and user address
     * @returns Promise resolving to a URL string
     */
    abstract buildOnrampUrl(params: OnrampParams<TOnrampOptions>): Promise<string>;
}
