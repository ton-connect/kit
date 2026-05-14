/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Crypto onramp quote response with pricing information.
 */
export interface CryptoOnrampQuote<TMetadata = unknown> {
    /**
     * Source crypto currency address (contract address or 0x0... for native)
     */
    sourceCurrencyAddress: string;

    /**
     * Source chain identifier in CAIP-2 format (e.g. 'eip155:42161').
     *
     * @see https://chainagnostic.org/CAIPs/caip-2
     */
    sourceChain: string;

    /**
     * Target crypto currency address on TON (contract address or 0x0... for native)
     */
    targetCurrencyAddress: string;

    /**
     * Amount of source crypto to send.
     */
    sourceAmount: string;

    /**
     * Amount of target crypto to receive.
     */
    targetAmount: string;

    /**
     * Exchange rate (amount of target per 1 unit of source)
     */
    rate: string;

    /**
     * TON address that will receive the target crypto.
     */
    recipientAddress: string;

    /**
     * Identifier of the crypto onramp provider.
     */
    providerId: string;

    /**
     * Provider-specific metadata for the quote (e.g. raw response needed to execute)
     */
    metadata?: TMetadata;
}
