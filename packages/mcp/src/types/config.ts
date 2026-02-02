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

import type { IStorageAdapter } from './storage.js';
import type { ISignerAdapter } from './signer.js';
import type { IUserContextProvider } from './user-context.js';
import type { IContactResolver } from './contacts.js';

/**
 * Safety limits configuration
 */
export interface LimitsConfig {
    /** Maximum TON amount per single transaction */
    maxTransactionTon?: number;
    /** Maximum TON amount per day per user */
    dailyLimitTon?: number;
    /** Maximum number of wallets per user */
    maxWalletsPerUser?: number;
}

/**
 * Configuration for createTonWalletMCP factory
 */
export interface TonMcpConfig {
    /**
     * Storage adapter for wallet metadata, contacts, pending transactions.
     * Required.
     */
    storage: IStorageAdapter;

    /**
     * Signer adapter for secure key management and signing.
     * Required.
     */
    signer: ISignerAdapter;

    /**
     * User context provider for extracting authenticated user ID.
     * Required.
     */
    userContext: IUserContextProvider;

    /**
     * Optional contact resolver for name-to-address resolution.
     */
    contacts?: IContactResolver;

    /**
     * Default network for new wallets.
     * @default 'mainnet'
     */
    network?: 'mainnet' | 'testnet';

    /**
     * Safety limits for transactions and wallets.
     */
    limits?: LimitsConfig;

    /**
     * If true, transactions require explicit confirmation via confirm_transaction tool.
     * Recommended for Telegram bots and other user-facing applications.
     * @default false
     */
    requireConfirmation?: boolean;
}
