/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AccountStatus } from '@ton/core';

import type { RawStackItem } from '../../utils';

export interface InternalTransactionId {
    lt: string;
    hash: string;
}

export interface TonBlockIdExt {
    workchain: number;
    shard: string;
    seqno: number;
    root_hash: string;
    file_hash: string;
}

export interface V2AddressInformation {
    balance: string;
    code: string;
    data: string;
    frozen_hash: string;
    last_transaction_hash: string;
    last_transaction_lt: string;
    status: AccountStatus;
    extra_currencies?: Array<{
        id: number;
        amount: string;
    }>;
    block_id?: TonBlockIdExt;
}

export interface V3RunGetMethodRequest {
    gas_used: number;
    stack: RawStackItem[];
    exit_code: number;
}

export interface V2SendMessageResult {
    message_hash: string;
    message_hash_norm: string;
}
