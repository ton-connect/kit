/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { asAddressFriendly, compareAddress } from '../../../utils';
import type { TransactionsUpdate } from '../../types';
import type { StreamingV2TransactionsNotification } from '../types/transaction';
import { toStreamingTransaction } from './map-transaction';

export function mapTransactions(
    account: string,
    notification: StreamingV2TransactionsNotification,
): TransactionsUpdate {
    return {
        address: asAddressFriendly(account),
        transactions: notification.transactions
            .filter((tx) => compareAddress(tx.account, account))
            .map((tx) => toStreamingTransaction(tx, notification.trace_external_hash_norm)),
        addressBook: notification.address_book,
        metadata: notification.metadata,
        finality: notification.finality,
    };
}
