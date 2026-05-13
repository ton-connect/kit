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
export type CryptoOnrampStatus = 'success' | 'pending' | 'failed';
