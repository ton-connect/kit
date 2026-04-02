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
    'streaming:balance-update': BalanceUpdate;
    'streaming:transactions': TransactionsUpdate;
    'streaming:jettons-update': JettonUpdate;
}
