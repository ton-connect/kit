/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BalanceUpdate } from './BalanceUpdate';
import type { TransactionsUpdate } from './TransactionsUpdate';
import type { JettonUpdate } from './JettonUpdate';

export interface StreamingEvents {
    /** Fired by a streaming provider when a watched address's TON balance changes. */
    'streaming:balance-update': BalanceUpdate;
    /** Fired by a streaming provider when new transactions land for a watched address. */
    'streaming:transactions': TransactionsUpdate;
    /** Fired by a streaming provider when a watched address's jetton holdings change. */
    'streaming:jettons-update': JettonUpdate;
}
