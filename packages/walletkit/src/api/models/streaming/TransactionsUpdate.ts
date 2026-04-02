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
    /** The update type field */
    type: 'transactions';
    /** The account address */
    address: UserFriendlyAddress;
    /** The array of transactions */
    transactions: Transaction[];
    /** The hash of the trace */
    traceHash: Hex;
    /** Address book from streaming v2 notification */
    addressBook?: AddressBook;
    /** Metadata from streaming v2 notification */
    metadata?: TransactionAddressMetadata;
}
