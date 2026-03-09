/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Wallet } from '@ton/walletkit';

import type { IContactResolver } from './contacts.js';

export interface NetworkConfig {
    apiKey?: string;
}

export interface TonCliConfig {
    wallet: Wallet;
    contacts?: IContactResolver;
    networks?: {
        mainnet?: NetworkConfig;
        testnet?: NetworkConfig;
    };
}
