/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { toAccount } from '../../../types/toncenter/AccountEvent';
import type { TonApiAccountEvent, TonApiAccountRef } from '../types/events';
import { toHex } from './map-transactions';

export function normalizeTonApiAccountAddress(account: TonApiAccountRef): string {
    if (typeof account === 'string') {
        return account;
    }
    return account?.address ?? '';
}

export function mapTonApiEvent(raw: TonApiAccountEvent) {
    return {
        eventId: toHex(raw.event_id),
        account: toAccount(raw.account, {}),
        timestamp: Number(raw.timestamp ?? 0),
        actions: (raw.actions ?? []).map((action) => {
            const status: 'success' | 'failure' = action.status === 'failed' ? 'failure' : 'success';
            const actionType = action.type ?? 'Unknown';
            const payload = actionType ? action[actionType] : undefined;
            const actionIdSource = action.base_transactions?.[0] ?? raw.event_id;
            return {
                type: actionType,
                id: toHex(actionIdSource),
                status,
                simplePreview: {
                    name: action.simple_preview?.name ?? actionType ?? 'Action',
                    description: action.simple_preview?.description ?? action.simple_preview?.name ?? 'Action',
                    value: action.simple_preview?.value ?? '',
                    accounts: (action.simple_preview?.accounts ?? []).map((account) =>
                        toAccount(normalizeTonApiAccountAddress(account), {}),
                    ),
                    valueImage: action.simple_preview?.value_image,
                },
                baseTransactions: (action.base_transactions ?? []).map((transactionHash) =>
                    toHex(String(transactionHash)),
                ),
                ...(payload && typeof payload === 'object' ? { [actionType]: payload } : {}),
            };
        }),
        isScam: raw.is_scam ?? false,
        lt: Number(raw.lt ?? 0),
        inProgress: raw.in_progress ?? false,
        trace: {
            tx_hash: '',
            in_msg_hash: null,
            children: [],
        },
        transactions: {},
    };
}
