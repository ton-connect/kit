/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Transaction } from '../transactions/Transaction';
import type { TransactionAddressMetadata } from '../transactions/TransactionMetadata';
import type { Hex, UserFriendlyAddress } from '../core/Primitives';
import type { AddressBook } from '../core/AddressBook';
import type { StreamingBaseUpdate } from './StreamingBaseUpdate';

export interface TransactionsUpdate extends StreamingBaseUpdate {
    /** Discriminator pinned to `'transactions'` — identifies this update as a transactions stream payload. */
    type: 'transactions';
    /** Account address the transactions belong to (the watched address). */
    address: UserFriendlyAddress;
    /** Transactions that landed for `address` in this update. */
    transactions: Transaction[];
    /** Hash of the trace that produced these transactions — the root external-message hash that spawned them. */
    traceHash: Hex;
    /** Pre-resolved address-book entries for raw addresses referenced inside `transactions`, so the UI can render labels without extra lookups. */
    addressBook?: AddressBook;
    /** Pre-fetched address metadata (interfaces, domain) for the watched `address`. */
    metadata?: TransactionAddressMetadata;
}
