/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AccountState, AccountStatus, ExtraCurrencies, UserFriendlyAddress } from '../../../api/models';
import { asAddressFriendly } from '../../../utils/address';
import { Base64ToHex } from '../../../utils/base64';
import { formatUnits } from '../../../utils/units';
import type { ToncenterAccountStatesEntry } from '../types/account-states';
import { parseInternalTransactionId } from '../utils';

function toAccountStatus(raw: ToncenterAccountStatesEntry['status']): AccountStatus {
    switch (raw) {
        case 'active':
            return 'active';
        case 'uninit':
            return 'uninitialized';
        case 'frozen':
            return 'frozen';
        case 'nonexist':
            return 'non-existing';
    }
}

export function mapAccountStatesEntry(raw: ToncenterAccountStatesEntry, address: UserFriendlyAddress): AccountState {
    const extraCurrencies: ExtraCurrencies = { ...(raw.extra_currencies ?? {}) };

    const out: AccountState = {
        address: asAddressFriendly(address),
        status: toAccountStatus(raw.status),
        rawBalance: raw.balance,
        balance: formatUnits(raw.balance, 9),
        extraCurrencies,
        code: raw.code_boc ?? undefined,
        data: raw.data_boc ?? undefined,
        lastTransaction:
            parseInternalTransactionId({
                hash: raw.last_transaction_hash ?? '',
                lt: raw.last_transaction_lt ?? '',
            }) ?? undefined,
    };
    if (raw.frozen_hash) {
        out.frozenHash = Base64ToHex(raw.frozen_hash) ?? undefined;
    }
    return out;
}

/**
 * Synthesizes a `non-existing` AccountState entry for addresses that toncenter
 * silently dropped from a bulk response. Keeps the contract uniform across providers.
 */
export function makeNonExistingAccountState(address: UserFriendlyAddress): AccountState {
    return {
        address: asAddressFriendly(address),
        status: 'non-existing',
        rawBalance: '0',
        balance: '0',
        extraCurrencies: {},
    };
}
