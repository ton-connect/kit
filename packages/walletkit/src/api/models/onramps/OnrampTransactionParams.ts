/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface OnrampTransactionParams<TProviderOptions = unknown> {
    /**
     * The unique identifier assigned to the transaction by the provider
     */
    transactionId: string;
    
    /**
     * Provider-specific options
     */
    providerOptions?: TProviderOptions;
}
