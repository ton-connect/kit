/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StreamingV2Finality } from './core';

export interface StreamingV2AccountState {
    hash: string;
    balance?: string | null;
    extra_currencies?: Record<string, string> | null;
    account_status?: string | null;
    frozen_hash?: string | null;
    data_hash?: string | null;
    code_hash?: string | null;
}

export interface StreamingV2AccountStateNotification {
    type: 'account_state_change';
    finality: StreamingV2Finality;
    account: string;
    state: {
        hash: string;
        balance: string;
        account_status: string;
        data_hash: string;
        code_hash: string;
    };
}
