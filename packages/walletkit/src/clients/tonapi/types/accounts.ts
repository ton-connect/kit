/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface TonApiAccountAddress {
    address: string;
    name?: string;
    is_scam: boolean;
    icon?: string;
    is_wallet: boolean;
}

export interface TonApiBlockchainAccount {
    address: string;
    balance: number;
    extra_balance?: {
        amount: string;
        preview: { id: number; symbol: string; decimals: number; image: string };
    }[];
    code: string | null;
    data: string | null;
    last_transaction_lt: number;
    last_transaction_hash: string | null;
    frozen_hash: string | null;
    status: 'nonexist' | 'uninit' | 'active' | 'frozen';
    storage?: {
        used_cells: number;
        used_bits: number;
        used_public_cells: number;
        last_paid: number;
        due_payment: number;
    };
}
