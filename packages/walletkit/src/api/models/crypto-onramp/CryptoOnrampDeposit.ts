/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Deposit details returned by a crypto onramp provider.
 *
 * The user must send `amount` of `sourceCurrency` to `address` on `sourceNetwork`
 * to complete the onramp; the provider then delivers the target crypto to the
 * user's TON address.
 */
export interface CryptoOnrampDeposit {
    /**
     * Deposit address on the source chain
     */
    address: string;

    /**
     * Exact amount of source crypto the user must send
     */
    amount: string;

    /**
     * Source crypto currency ticker (e.g. 'USDC')
     */
    sourceCurrency: string;

    /**
     * Source network identifier (e.g. 'solana')
     */
    sourceNetwork: string;

    /**
     * Optional memo / tag required by some chains (e.g. XRP, TON comment)
     */
    memo?: string;

    /**
     * Unix timestamp (ms) after which the deposit offer is no longer valid
     */
    expiresAt?: number;

    /**
     * Network-specific warning to show the user (e.g. "send only on Solana")
     */
    networkWarning?: string;

    /**
     * Identifier of the provider that issued this deposit
     */
    providerId: string;

    /**
     * Provider-specific metadata (e.g. transaction id for status polling)
     */
    metadata?: unknown;
}
