/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../core/Primitives';
import type { CryptoOnrampQuote } from './CryptoOnrampQuote';

/**
 * Parameters for creating a crypto onramp deposit
 */
export interface CryptoOnrampDepositParams<TProviderOptions = unknown> {
    /**
     * Quote to execute the deposit against
     */
    quote: CryptoOnrampQuote;

    /**
     * TON address of the user that will receive the target crypto
     */
    userAddress: UserFriendlyAddress;

    /**
     * Provider-specific options
     */
    providerOptions?: TProviderOptions;
}
