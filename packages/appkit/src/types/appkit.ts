/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Wallet } from '@ton/walletkit';

import type { EventBus } from '../core/events';
import type { WalletProvider } from './wallet-provider';

/**
 * Transaction result from sending a transaction
 */
export interface TransactionResult {
    boc: string;
}

/**
 * AppKit main interface - Central hub for wallet management
 */
export interface AppKit {
    /** Centralized event bus for wallet events */
    readonly eventBus: EventBus;

    /** Registered wallet providers */
    readonly providers: ReadonlyArray<WalletProvider>;

    /** Register a wallet provider */
    registerProvider(provider: WalletProvider): void;

    /** Get all connected wallets from all providers */
    getConnectedWallets(): Promise<Wallet[]>;

    /** Connect wallet using specific provider */
    connectWallet(providerId: string): Promise<void>;

    /** Disconnect wallet using specific provider */
    disconnectWallet(providerId: string): Promise<void>;
}
