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
    extra_balance: {
        amount: string;
        preview: { id: number; symbol: string; decimals: number; image: string };
    }[];
    currencies_balance: Record<string, unknown>;
    last_activity: number;
    status: 'nonexist' | 'uninit' | 'active' | 'frozen';
    interfaces?: string[];
    name?: string;
    is_scam?: boolean;
    icon?: string;
    memo_required?: boolean;
    get_methods: string[];
    is_suspended?: boolean;
    is_wallet?: boolean;
}

export interface TonApiAccountAddress {
    address: string;
    name?: string;
    is_scam: boolean;
    icon?: string;
    is_wallet: boolean;
}
