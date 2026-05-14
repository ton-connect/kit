/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CryptoOnrampDeposit, CryptoOnrampDepositParams } from '../../crypto-onramp';
import type { AppKit } from '../../core/app-kit';

/**
 * Options for {@link createCryptoOnrampDeposit} — extends {@link CryptoOnrampDepositParams} with an optional provider override.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type CreateCryptoOnrampDepositOptions<T = unknown> = CryptoOnrampDepositParams<T> & {
    /** Provider to create the deposit through. Defaults to `quote.providerId`, then to the default provider. */
    providerId?: string;
};

/**
 * Return type of {@link createCryptoOnrampDeposit}.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type CreateCryptoOnrampDepositReturnType = Promise<CryptoOnrampDeposit>;

/**
 * Create a crypto-onramp deposit from a quote previously obtained via {@link getCryptoOnrampQuote} — the returned {@link CryptoOnrampDeposit} carries the address and amount the user must send on the source chain.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link CreateCryptoOnrampDepositOptions} Quote, refund address, and optional provider override.
 * @returns Deposit details the UI should show to the user (address, amount, optional `memo`/`expiresAt`).
 *
 * @expand options
 *
 * @public
 * @category Action
 * @section Crypto Onramp
 */
export const createCryptoOnrampDeposit = async <T = unknown>(
    appKit: AppKit,
    options: CreateCryptoOnrampDepositOptions<T>,
): CreateCryptoOnrampDepositReturnType => {
    return appKit.cryptoOnrampManager.createDeposit(options, options.providerId);
};
