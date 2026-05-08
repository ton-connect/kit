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
    CryptoOnrampProviderMetadata,
    CryptoOnrampQuote,
    CryptoOnrampQuoteParams,
    CryptoOnrampStatus,
    CryptoOnrampStatusParams,
} from '../models';
import type { DefiManagerAPI } from './DefiManagerAPI';
import type { DefiProvider } from './DefiProvider';

/**
 * Crypto onramp API interface exposed by CryptoOnrampManager
 */
export interface CryptoOnrampAPI extends DefiManagerAPI<CryptoOnrampProviderInterface> {
    /**
     * Get a quote for onramping from another crypto asset into a TON asset
     * @param params Quote parameters (source currency/network, target currency, amount)
     * @param providerId Provider identifier (optional, uses default if not specified)
     * @returns A promise that resolves to a CryptoOnrampQuote
     */
    getQuote(params: CryptoOnrampQuoteParams, providerId?: string): Promise<CryptoOnrampQuote>;

    /**
     * Create a deposit for a previously obtained quote
     * @param params Deposit parameters (quote, user TON address)
     * @param providerId Provider identifier (optional, uses default if not specified)
     * @returns A promise that resolves to a CryptoOnrampDeposit
     */
    createDeposit(params: CryptoOnrampDepositParams, providerId?: string): Promise<CryptoOnrampDeposit>;

    /**
     * Get the status of a deposit
     * @param params - Deposit status parameters including the deposit ID
     * @returns Promise resolving to the deposit status
     */
    getStatus(params: CryptoOnrampStatusParams, providerId?: string): Promise<CryptoOnrampStatus>;
}

/**
 * Interface that all crypto onramp providers must implement
 */
export interface CryptoOnrampProviderInterface<
    TQuoteOptions = unknown,
    TDepositOptions = unknown,
> extends DefiProvider {
    /** Provider kind discriminator pinned to `'crypto-onramp'` so {@link registerProvider} routes it to the crypto-onramp manager. */
    readonly type: 'crypto-onramp';

    /**
     * Unique identifier for the provider
     */
    readonly providerId: string;

    /**
     * Get static metadata for the provider (display name, logo, url).
     */
    getMetadata(): CryptoOnrampProviderMetadata;

    /**
     * Get a quote for onramping from another crypto asset into a TON asset
     * @param params Quote parameters including provider-specific options
     * @returns A promise that resolves to a CryptoOnrampQuote
     */
    getQuote(params: CryptoOnrampQuoteParams<TQuoteOptions>): Promise<CryptoOnrampQuote>;

    /**
     * Create a deposit for a previously obtained quote
     * @param params Deposit parameters including provider-specific options
     * @returns A promise that resolves to a CryptoOnrampDeposit
     */
    createDeposit(params: CryptoOnrampDepositParams<TDepositOptions>): Promise<CryptoOnrampDeposit>;

    /**
     * Get the status of a deposit
     * @param params - Deposit status parameters including the deposit ID
     * @returns Promise resolving to the deposit status
     */
    getStatus(params: CryptoOnrampStatusParams): Promise<CryptoOnrampStatus>;
}
