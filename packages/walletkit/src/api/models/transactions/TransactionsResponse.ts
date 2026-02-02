/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AddressBook } from '../core/AddressBook';
import type { Transaction } from './Transaction';

export interface TransactionsResponse {
    transactions: Transaction[];
    addressBook: AddressBook;
}
