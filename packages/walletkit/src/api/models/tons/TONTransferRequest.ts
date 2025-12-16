/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ExtraCurrencies } from '../core/ExtraCurrencies';
import type { UserFriendlyAddress, Base64String } from '../core/Primitives';
import type { TokenAmount } from '../core/TokenAmount';
import type { SendMode } from '../core/SendMode';

/**
 * Request parameters for transferring TON to another address.
 */
export interface TONTransferRequest {
    /**
     * Amount to transfer in nanotons
     */
    transferAmount: TokenAmount;

    /**
     * Recipient address in user-friendly format
     */
    recipientAddress: UserFriendlyAddress;

    /**
     * Send mode flags controlling message behavior (e.g., pay fees separately, bounce on failure)
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
     * Message payload data encoded in Base64 (e.g., for contract calls)
     */
    payload?: Base64String;

    /**
     * Human-readable text comment attached to the transfer
     */
    comment?: string;
}
