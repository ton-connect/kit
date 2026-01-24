/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NetworkManager } from '@ton/walletkit';

import type { EventBus } from '../features/events';
import type { WalletInterface } from './wallet';

/**
 * Interface for wallet providers
 */
export interface WalletProvider {
    /** Provider unique identifier */
    readonly id: string;

    /** Protocol type (e.g. 'tonconnect', 'ledger', 'mnemonic') */
    readonly type: string;

    /** Initialize provider (restore connections, setup event listeners) */
    initialize(eventBus: EventBus, networkManager: NetworkManager): Promise<void>;

    /** Cleanup provider resources */
    destroy(): void;

    /** Connect a wallet */
    connectWallet(): Promise<void>;

    /** Disconnect a wallet */
    disconnectWallet(): Promise<void>;

    /** Get connected wallets */
    getConnectedWallets(): WalletInterface[];
}
