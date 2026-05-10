/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SendTransactionRequest } from '@tonconnect/sdk';

import type { TransactionRequest, TransactionRequestMessage } from '../../../types/transaction';

/**
 * Default transaction validity duration in seconds (5 minutes)
 */
export const DEFAULT_TRANSACTION_VALIDITY_SECONDS = 300;

/**
 * Convert a walletkit `TransactionRequest` to a TonConnect `SendTransactionRequest`.
 */
export const toTonConnectTransaction = (request: TransactionRequest): SendTransactionRequest => {
    return {
        validUntil: request.validUntil ?? Math.floor(Date.now() / 1000) + DEFAULT_TRANSACTION_VALIDITY_SECONDS,
        messages: request.messages.map(toTonConnectMessage),
    };
};

/**
 * Convert a single TransactionRequestMessage to TonConnect message format
 */
export const toTonConnectMessage = (
    msg: TransactionRequestMessage,
): {
    address: string;
    amount: string;
    payload?: string;
    stateInit?: string;
} => {
    return {
        address: msg.address,
        amount: String(msg.amount),
        payload: msg.payload,
        stateInit: msg.stateInit,
    };
};

/**
 * Get current timestamp plus validity duration
 */
export const getValidUntil = (validitySeconds = DEFAULT_TRANSACTION_VALIDITY_SECONDS): number => {
    return Math.floor(Date.now() / 1000) + validitySeconds;
};
