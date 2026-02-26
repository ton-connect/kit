/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TonApiAccountAddress } from './accounts';

export interface TonApiJettonMetadata {
    address: string;
    name: string;
    symbol: string;
    decimals: string;
    image: string;
    description: string;
    social: string[];
    websites: string[];
    catalogs: string[];
}

export interface TonApiJettonInfo {
    mintable: boolean;
    total_supply: string;
    admin: TonApiAccountAddress;
    metadata: TonApiJettonMetadata;
    verification: 'whitelist' | 'blacklist' | 'none';
}

export interface TonApiJettonPreview {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    image: string;
    verification: 'whitelist' | 'blacklist' | 'none';
}

export interface TonApiJettonBalance {
    balance: string;
    price?: {
        prices: Record<string, number>;
        diff_24h: Record<string, string>;
        diff_7d: Record<string, string>;
        diff_30d: Record<string, string>;
    };
    wallet_address: TonApiAccountAddress;
    jetton: TonApiJettonPreview;
}

export interface TonApiJettonsBalances {
    balances: TonApiJettonBalance[];
}
