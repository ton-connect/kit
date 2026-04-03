/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface AppkitUIToken {
    /** Token symbol, e.g. "TON" */
    symbol: string;
    /** Full token name, e.g. "Toncoin" */
    name: string;
    /** Number of decimals for the token */
    decimals: number;
    /** Jetton contract address (use "ton" for TON) */
    address: string;
    /** Optional token logo */
    logo?: string;
    /** Optional exchange rate: 1 token = rate fiat units (used for fiat value display) */
    rate?: string;
}
