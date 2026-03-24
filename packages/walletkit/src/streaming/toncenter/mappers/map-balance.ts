/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { asAddressFriendly } from '../../../utils';
import type { BalanceUpdate } from '../../../api/models';
import type { StreamingV2AccountStateNotification } from '../types';
import { formatUnits } from '../../../utils/units';

/**
 * Maps Toncenter account state change notification to a BalanceUpdate.
 * @param notification - Raw notification from Toncenter WebSocket
 * @returns BalanceUpdate object
 */
export const mapBalance = (notification: StreamingV2AccountStateNotification): BalanceUpdate => {
    return {
        type: 'balance',
        address: asAddressFriendly(notification.account),
        rawBalance: notification.state.balance,
        balance: formatUnits(notification.state.balance, 9),
        status: notification.finality,
    };
};
