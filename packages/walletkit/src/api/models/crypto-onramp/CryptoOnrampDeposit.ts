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
 * The user must send `amount` of `sourceCurrencyAddress` to `address` on `sourceChain`
 * to complete the onramp. The provider then delivers the target crypto to the * user's TON address.
 */
export interface CryptoOnrampDeposit {
    /**
     * Deposit id
     */
    depositId: string;

    /**
     * Deposit address on the source chain
     */
    address: string;

    /**
     * Exact amount of source crypto the user must send
     */
    amount: string;

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
     * Optional memo / tag required by some chains (e.g. XRP, TON comment)
     */
    memo?: string;

    /**
     * Unix timestamp (ms) after which the deposit offer is no longer valid
     */
    expiresAt?: number;

    /**
     * Chain-specific warning to show the user (e.g. "send only on Solana")
     */
    chainWarning?: string;

    /**
     * Identifier of the provider that issued this deposit
     */
    providerId: string;
}
