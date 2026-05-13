/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Final state of a crypto-onramp deposit — `'success'` (delivered to the recipient), `'pending'` (still in flight) or `'failed'` (provider could not complete the deposit).
 */
export type CryptoOnrampStatus = 'success' | 'pending' | 'failed';
