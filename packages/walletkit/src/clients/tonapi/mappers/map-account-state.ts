/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AccountStatus } from '@ton/core';

import type { Hex } from '../../../api/models';
import type { FullAccountState, TransactionId } from '../../../types/toncenter/api';
import type { TonApiBlockchainAccount } from '../types/accounts';

export function mapAccountState(raw: TonApiBlockchainAccount): FullAccountState {
    let status: AccountStatus;
    switch (raw.status) {
        case 'nonexist':
            status = 'non-existing';
            break;
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
            status = 'non-existing';
    }

    const extraCurrencies: Record<number, bigint> = {};
    if (raw.extra_balance && Array.isArray(raw.extra_balance)) {
        for (const extra of raw.extra_balance) {
            extraCurrencies[extra.preview.id] = BigInt(extra.amount);
        }
    }

    let lastTransaction: TransactionId | null = null;
    if (raw.last_transaction_lt && raw.last_transaction_hash) {
        lastTransaction = {
            lt: raw.last_transaction_lt.toString(),
            hash: (raw.last_transaction_hash.startsWith('0x')
                ? raw.last_transaction_hash
                : `0x${raw.last_transaction_hash}`) as Hex,
        };
    }

    const out: FullAccountState = {
        status,
        balance: raw.balance.toString(),
        extraCurrencies,
        code: raw.code ? Buffer.from(raw.code, 'hex').toString('base64') : null,
        data: raw.data ? Buffer.from(raw.data, 'hex').toString('base64') : null,
        lastTransaction,
    };

    return out;
}
