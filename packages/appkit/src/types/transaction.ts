/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ExtraCurrencies, TokenAmount } from './primitives';
import type { Network } from './network';

export type { TransactionStatus, TransactionStatusResponse } from '@ton/walletkit';

/**
 * Wallet response carrying the BoC (bag of cells) of the external message that was signed and broadcast — used to track or hash the resulting transaction.
 *
 * @extract
 * @public
 * @category Type
 * @section Transactions
 */
export type { SendTransactionResponse } from '@ton/walletkit';

/**
 * Transaction payload passed to {@link WalletInterface}'s `sendTransaction` — one or more messages, optional network override and `validUntil` deadline.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export interface TransactionRequest {
    /** Messages to include in the transaction. */
    messages: TransactionRequestMessage[];

    /** Network to execute the transaction on. */
    network?: Network;

    /** Unix timestamp (seconds) after which the transaction becomes invalid. */
    validUntil?: number;

    /** Sender wallet address — accepts either raw or user-friendly format. */
    fromAddress?: string;
}

/**
 * Individual message inside a {@link TransactionRequest} — recipient, amount, optional payload and contract `stateInit`.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export interface TransactionRequestMessage {
    /** Recipient wallet address — accepts either raw or user-friendly format. */
    address: string;

    /** Amount to transfer, in nano-TON (1 TON = 10⁹ nano-TON). */
    amount: TokenAmount;

    /** Additional currencies to include in the transfer. */
    extraCurrency?: ExtraCurrencies;

    /** Initial state for deploying a new contract, encoded as Base64. */
    stateInit?: string;

    /** Message payload, encoded as Base64. */
    payload?: string;
}
