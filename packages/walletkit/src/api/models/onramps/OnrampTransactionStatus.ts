/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type OnrampStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'unknown';

/**
 * Detailed status of an Onramp transaction
 */
export interface OnrampTransactionStatus {
    /**
     * Core status normalized mapping
     */
    status: OnrampStatus;

    /**
     * Provider's exact raw status string for reference
     */
    rawStatus: string;

    /**
     * Associated internal/provider transaction ID
     */
    transactionId: string;

    /**
     * Fiat currency used
     */
    fiatCurrency: string;

    /**
     * Fiat amount spent
     */
    fiatAmount: string;

    /**
     * Crypto currency bought
     */
    cryptoCurrency: string;
    
    /**
     * Blockchain transaction hash if available
     */
    txHash?: string;
    
    /**
     * Destination wallet address
     */
    walletAddress?: string;

    /**
     * Provider identifier
     */
    providerId: string;
}
