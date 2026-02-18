/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ExtraCurrencies, TokenAmount } from '@ton/walletkit';

import type { Network } from './network';

export interface TransactionRequest {
    /**
     * List of messages to include in the transaction
     */
    messages: TransactionRequestMessage[];

    /**
     * Network to execute the transaction on
     */
    network?: Network;

    /**
     * Unix timestamp after which the transaction becomes invalid
     */
    validUntil?: number;

    /**
     * Sender wallet address in received format(raw, user friendly)
     */
    fromAddress?: string;
}

/**
 * Individual message within a transaction request.
 */
export interface TransactionRequestMessage {
    /**
     * Recipient wallet address in format received from caller (raw, user friendly)
     */
    address: string;

    /**
     * Amount to transfer in nanos
     */
    amount: TokenAmount;

    /**
     * Additional currencies to include in the transfer
     */
    extraCurrency?: ExtraCurrencies;

    /**
     * Initial state for deploying a new contract, encoded in Base64
     */
    stateInit?: string;

    /**
     * Message payload data encoded in Base64
     */
    payload?: string;
}
