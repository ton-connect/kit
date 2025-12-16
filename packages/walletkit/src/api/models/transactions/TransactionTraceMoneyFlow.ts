/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TokenAmount } from '../core/TokenAmount';
import type { UserFriendlyAddress } from '../core/Primitives';
import type { AssetType } from '../core/AssetType';

/**
 * Summary of token flows for a transaction.
 */
export interface TransactionTraceMoneyFlow {
    /**
     * Total token amounts output by the transaction
     */
    outputs: TokenAmount;
    /**
     * Total token amounts input to the transaction
     */
    inputs: TokenAmount;
    /**
     * List of all token transfers involved in the transaction
     */
    allJettonTransfers: TransactionTraceMoneyFlowItem[];
    /**
     * List of token transfers involving our address
     */
    ourTransfers: TransactionTraceMoneyFlowItem[];
    /**
     * Our address involved in the transaction (if any)
     */
    ourAddress?: UserFriendlyAddress;
}

/**
 * Individual token flow item.
 */
export interface TransactionTraceMoneyFlowItem {
    /**
     * Type of asset being transferred
     */
    assetType: AssetType;

    /**
     * Amount being transferred (for TON/Jetton)
     */
    amount: TokenAmount;

    /**
     * Address of the token contract (for Jetton/NFT)
     */
    tokenAddress?: UserFriendlyAddress;

    /**
     * Sender address
     */
    fromAddress?: UserFriendlyAddress;

    /**
     * Recipient address
     */
    toAddress?: UserFriendlyAddress;
}
