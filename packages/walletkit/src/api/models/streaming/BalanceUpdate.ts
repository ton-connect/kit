/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../core/Primitives';
import type { StreamingBaseUpdate } from './StreamingBaseUpdate';
import type { TokenAmount } from '../core/TokenAmount';

export interface BalanceUpdate extends StreamingBaseUpdate {
    /** The update type field */
    type: 'balance';
    /** The account address */
    address: UserFriendlyAddress;
    /** The account balance in nano units */
    rawBalance: TokenAmount;
    /** The formatted balance */
    balance: string;
}
