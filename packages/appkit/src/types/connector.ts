/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NetworkManager } from '@ton/walletkit';

import type { Emitter, AppKitEvents } from '../core/events';
import type { WalletInterface } from '../features/wallets';

/**
 * Interface for wallet connectors
 */
export interface Connector {
    /** Provider unique identifier */
    readonly id: string;

    /** Protocol type (e.g. 'tonconnect', 'ledger', 'mnemonic') */
    readonly type: string;

    /** Initialize connector (restore connections, setup event listeners) */
    initialize(emitter: Emitter<AppKitEvents>, networkManager: NetworkManager): Promise<void>;

    /** Cleanup connector resources */
    destroy(): void;

    /** Connect a wallet */
    connectWallet(): Promise<void>;

    /** Disconnect a wallet */
    disconnectWallet(): Promise<void>;

    /** Get connected wallets */
    getConnectedWallets(): WalletInterface[];
}
