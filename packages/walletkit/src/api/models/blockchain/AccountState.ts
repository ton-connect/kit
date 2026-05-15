/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AccountStatus, ExtraCurrency } from '@ton/core';

import type { Hex, UserFriendlyAddress } from '../core/Primitives';
import type { TokenAmount } from '../core/TokenAmount';
import type { TransactionId } from './TransactionId';

/**
 * Blockchain state of an account at a given point in time.
 *
 * The `status` field distinguishes four cases:
 * - `active` — contract deployed, `code` and `data` present
 * - `uninitialized` — has balance/history but no contract deployed; `code`/`data` omitted
 * - `frozen` — frozen due to storage debt; `frozenHash` points at the pre-freeze state
 * - `non-existing` — no on-chain record at all; balance is `'0'` and other fields omitted
 */
export interface AccountState {
    /**
     * Canonical (bounceable) representation of the account address.
     */
    address: UserFriendlyAddress;

    /**
     * On-chain account status: `active`, `uninitialized`, `frozen`, or `non-existing`.
     */
    status: AccountStatus;

    /**
     * Balance in nanotons as a decimal string (raw on-chain amount).
     */
    rawBalance: TokenAmount;

    /**
     * Balance formatted in TON (10^9 nanotons = 1 TON).
     */
    balance: string;

    /**
     * Additional currencies attached to the account, keyed by currency id.
     * Empty object if there are none.
     */
    extraCurrencies: ExtraCurrency;

    /**
     * Base64-encoded contract code BOC. Omitted if the contract is not deployed.
     */
    code?: string;

    /**
     * Base64-encoded contract data BOC. Omitted if the contract is not deployed.
     */
    data?: string;

    /**
     * The most recent transaction applied to this account.
     * Omitted if there have been no transactions (e.g. `non-existing` accounts).
     */
    lastTransaction?: TransactionId;

    /**
     * Hex hash of the pre-freeze account state. Present only when `status` is `frozen`.
     */
    frozenHash?: Hex;
}
