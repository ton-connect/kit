/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface TonApiAccount {
    address: string;
    balance: number;
    extra_balance?: Record<string, string>;
    code?: string;
    data?: string;
    last_transaction_lt: number;
    last_transaction_hash: string;
    frozen_hash?: string;
    status: 'nonexist' | 'uninit' | 'active' | 'frozen';
    interfaces?: string[];
    name?: string;
    is_scam?: boolean;
    icon?: string;
    memo_required?: boolean;
    get_methods: string[];
}

export interface TonApiAccountAddress {
    address: string;
    name?: string;
    is_scam: boolean;
    icon?: string;
    is_wallet: boolean;
}
