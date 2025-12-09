/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { TokenAmount } from "../core/TokenAmount";
import { UserFriendlyAddress } from "../core/Primitives";
import { AssetType } from "../core/AssetType";

/**
 * Summary of token flows for a transaction.
 */
export interface TransactionMoneyFlow {
  /**
   * List of incoming token transfers
   */
  incoming: TransactionMoneyFlowItem[];

  /**
   * List of outgoing token transfers
   */
  outgoing: TransactionMoneyFlowItem[];
}

/**
 * Individual token flow item.
 */
export interface TransactionMoneyFlowItem {
  /**
   * Type of asset being transferred
   */
  assetType: AssetType;

  /**
   * Amount being transferred (for TON/Jetton)
   */
  amount?: TokenAmount;

  /**
   * Address of the token contract (for Jetton/NFT)
   */
  tokenAddress?: UserFriendlyAddress;

  /**
   * Counterparty address (sender for incoming, recipient for outgoing)
   */
  address: UserFriendlyAddress;

  /**
   * Human-readable token symbol (e.g., "TON", "USDT")
   */
  symbol?: string;

  /**
   * Number of decimal places for display
   * @format int
   */
  decimals?: number;
}
