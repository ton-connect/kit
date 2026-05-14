/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Parameters for requesting a crypto-to-crypto onramp quote.
 *
 * The target network is always TON, so only the source side is parameterised.
 */
export interface CryptoOnrampQuoteParams<TProviderOptions = unknown> {
    /**
     * Amount to onramp (either source or target crypto, depending on isSourceAmount)
     */
    amount: string;

    /**
     * Source crypto currency address (contract address or 0x0... for native)
     */
    sourceCurrencyAddress: string;

    /**
     * Source chain identifier in CAIP-2 format (e.g. 'eip155:1' for Ethereum
     * mainnet, 'eip155:42161' for Arbitrum One). Providers map this to their
     * own chain identifiers internally.
     *
     * @see https://chainagnostic.org/CAIPs/caip-2
     */
    sourceChain: string;

    /**
     * Target crypto currency address on TON (contract address or 0x0... for native)
     */
    targetCurrencyAddress: string;

    /**
     * TON address that will receive the target crypto.
     */
    recipientAddress: string;

    /**
     * Refund address for the source crypto.
     */
    refundAddress?: string;

    /**
     * If true, `amount` is the source amount to spend.
     * If false, `amount` is the target amount to receive.
     * Defaults to true when omitted.
     */
    isSourceAmount?: boolean;

    /**
     * Provider-specific options.
     */
    providerOptions?: TProviderOptions;
}
