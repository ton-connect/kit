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

export interface JettonUpdate extends StreamingBaseUpdate {
    /** The update type field */
    type: 'jettons';
    /** The master jetton contract address */
    masterAddress: UserFriendlyAddress;
    /** The jetton wallet contract address */
    walletAddress: UserFriendlyAddress;
    /** The owner of the jetton wallet */
    ownerAddress: UserFriendlyAddress;
    /** Balance in raw smallest units (e.g. nano) */
    rawBalance: TokenAmount;
    /**
     * Decimals mapped from metadata if available
     * @format: int
     */
    decimals?: number;
    /** Human readable formatted balance if decimals are known */
    balance?: string;
}
