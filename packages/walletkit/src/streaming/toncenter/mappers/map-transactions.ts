/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { asAddressFriendly, Base64ToHex, compareAddress } from '../../../utils';
import type { TransactionsUpdate } from '../../../api/models';
import type { StreamingV2TransactionsNotification } from '../types';
import { toAddressBook } from '../../../types/toncenter/v3/AddressBookRowV3';
import { toStreamingTransaction } from './map-transaction';

export const mapTransactions = (
    account: string,
    notification: StreamingV2TransactionsNotification,
): TransactionsUpdate => {
    return {
        type: 'transactions',
        address: asAddressFriendly(account),
        traceHash: Base64ToHex(notification.trace_external_hash_norm),
        transactions: notification.transactions
            .filter((tx) => compareAddress(tx.account, account))
            .map((tx) => toStreamingTransaction(tx, notification.trace_external_hash_norm)),
        addressBook: notification.address_book ? toAddressBook(notification.address_book) : undefined,
        metadata: notification.metadata,
        status: notification.finality,
    };
};
