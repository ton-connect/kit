/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Raw entry from toncenter `/api/v3/accountStates` response.
 * Note: addresses are in UPPERCASE raw form, hashes are base64,
 * status is in short form (`active` | `uninit` | `frozen` | `nonexist`).
 */
export interface ToncenterAccountStatesEntry {
    address: string;
    balance: string;
    status: 'active' | 'uninit' | 'frozen' | 'nonexist';
    extra_currencies?: Record<string, string>;
    code_boc?: string | null;
    data_boc?: string | null;
    code_hash?: string;
    data_hash?: string;
    last_transaction_hash: string | null;
    last_transaction_lt: string | null;
    frozen_hash?: string | null;
    account_state_hash?: string;
}

export interface ToncenterAccountStatesResponse {
    accounts: ToncenterAccountStatesEntry[];
    address_book?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
