/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    AccountState,
    AccountStatus,
    ExtraCurrencies,
    Hex,
    TransactionId,
    UserFriendlyAddress,
} from '../../../api/models';
import { asAddressFriendly } from '../../../utils/address';
import { formatUnits } from '../../../utils/units';
import type { TonApiBlockchainAccount } from '../types/accounts';

export function mapAccountState(raw: TonApiBlockchainAccount, address: UserFriendlyAddress): AccountState {
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

    const extraCurrencies: ExtraCurrencies = {};
    if (raw.extra_balance && Array.isArray(raw.extra_balance)) {
        for (const extra of raw.extra_balance) {
            extraCurrencies[String(extra.preview.id)] = String(extra.amount);
        }
    }

    let lastTransaction: TransactionId | undefined;
    if (raw.last_transaction_lt && raw.last_transaction_hash) {
        lastTransaction = {
            lt: raw.last_transaction_lt.toString(),
            hash: (raw.last_transaction_hash.startsWith('0x')
                ? raw.last_transaction_hash
                : `0x${raw.last_transaction_hash}`) as Hex,
        };
    }

    const rawBalance = raw.balance.toString();

    return {
        address: asAddressFriendly(address),
        status,
        rawBalance,
        balance: formatUnits(rawBalance, 9),
        extraCurrencies,
        code: raw.code ? Buffer.from(raw.code, 'hex').toString('base64') : undefined,
        data: raw.data ? Buffer.from(raw.data, 'hex').toString('base64') : undefined,
        lastTransaction,
    };
}
