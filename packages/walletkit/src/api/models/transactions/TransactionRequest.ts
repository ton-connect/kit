/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ExtraCurrencies } from "../core/ExtraCurrencies";
import { Network } from "../core/Network";
import { UserFriendlyAddress, Base64String } from "../core/Primitives";
import { SendMode } from "../core/SendMode";
import { TokenAmount } from "../core/TokenAmount";

/**
 * Request to send a transaction on the TON blockchain.
 */
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
   * Sender wallet address
   */
  fromAddress?: UserFriendlyAddress;
}

/**
 * Individual message within a transaction request.
 */
export interface TransactionRequestMessage {
  /**
   * Recipient wallet address
   */
  recipientAddress: UserFriendlyAddress;

  /**
   * Amount to transfer in nanotons
   */
  transferAmount: TokenAmount;

  /**
   * Send mode flags controlling message behavior
   */
  mode?: SendMode;

  /**
   * Additional currencies to include in the transfer
   */
  extraCurrency?: ExtraCurrencies;

  /**
   * Initial state for deploying a new contract, encoded in Base64
   */
  stateInit?: Base64String;

  /**
   * Message payload data encoded in Base64
   */
  payload?: Base64String;
}
