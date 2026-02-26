/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AccountStatus } from '@ton/core';

import type { FullAccountState } from '../../../types/toncenter/api';
import type { TonApiAccount } from '../types/accounts';

export function mapAccountState(raw: TonApiAccount): FullAccountState {
    let status: AccountStatus;
    switch (raw.status) {
        case 'nonexist':
        case 'uninit':
            status = 'uninitialized';
            break;
        case 'active':
            status = 'active';
            break;
        case 'frozen':
            status = 'frozen';
            break;
        default:
            status = 'uninitialized';
    }

    const extraCurrencies: Record<number, bigint> = {};
    if (raw.extra_balance && Array.isArray(raw.extra_balance)) {
        for (const extra of raw.extra_balance) {
            extraCurrencies[extra.preview.id] = BigInt(extra.amount);
        }
    }

    const out: FullAccountState = {
        status,
        balance: raw.balance.toString(),
        extraCurrencies,
        code: null,
        data: null,
        lastTransaction: null,
    };

    return out;
}
