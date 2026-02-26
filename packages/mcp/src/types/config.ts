/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Configuration types for createTonWalletMCP factory
 */

import type { Wallet } from '@ton/walletkit';

import type { IContactResolver } from './contacts.js';

export type NetworkType = 'mainnet' | 'testnet' | 'tetra';

/**
 * Network-specific configuration
 */
export interface NetworkConfig {
    /** TonCenter API key for this network */
    apiKey?: string;
}

/**
 * Configuration for createTonWalletMCP factory
 */
export interface TonMcpConfig {
    /**
     * Wallet instance to use for operations.
     * Required.
     */
    wallet: Wallet;

    /**
     * Optional contact resolver for name-to-address resolution.
     */
    contacts?: IContactResolver;

    /**
     * Network-specific configuration (API keys).
     */
    networks?: {
        mainnet?: NetworkConfig;
        testnet?: NetworkConfig;
    };
}
