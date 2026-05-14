/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../core/Primitives';
import type { OnrampQuote } from './OnrampQuote';

/**
 * Parameters for building an onramp URL.
 */
export interface OnrampParams<TProviderOptions = unknown> {
    /**
     * The onramp quote to base the transaction on.
     */
    quote: OnrampQuote;

    /**
     * Address of the user receiving the crypto.
     */
    userAddress: UserFriendlyAddress;

    /**
     * URL to redirect the user to after a successful transaction (if supported by provider)
     */
    redirectUrl?: string;

    /**
     * Provider-specific options.
     */
    providerOptions?: TProviderOptions;
}
