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
    if (raw.extra_balance) {
        for (const [key, amount] of Object.entries(raw.extra_balance)) {
            extraCurrencies[parseInt(key)] = BigInt(amount);
        }
    }

    const out: FullAccountState = {
        status,
        balance: raw.balance.toString(),
        extraCurrencies,
        code: raw.code || '',
        data: raw.data || '',
        lastTransaction: null,
    };

    if (
        raw.last_transaction_hash &&
        raw.last_transaction_hash !== '0000000000000000000000000000000000000000000000000000000000000000'
    ) {
        const hashValue = (raw.last_transaction_hash.startsWith('0x')
            ? raw.last_transaction_hash
            : `0x${raw.last_transaction_hash}`) as unknown as NonNullable<FullAccountState['lastTransaction']>['hash'];

        out.lastTransaction = {
            lt: raw.last_transaction_lt.toString(),
            hash: hashValue,
        };
    }

    if (raw.frozen_hash) {
        out.frozenHash = (raw.frozen_hash.startsWith('0x')
            ? raw.frozen_hash
            : `0x${raw.frozen_hash}`) as unknown as FullAccountState['frozenHash'];
    }

    return out;
}
