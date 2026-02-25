/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NetworkManager, Network } from '@ton/walletkit';

import type { WalletInterface } from './wallet';
import type { AppKitEmitter } from '../core/app-kit';

/**
 * Interface for wallet connectors
 */
export interface Connector {
    /** Provider unique identifier */
    readonly id: string;

    /** Protocol type (e.g. 'tonconnect', 'ledger', 'mnemonic') */
    readonly type: string;

    readonly metadata: ConnectorMetadata;

    /** Initialize connector (restore connections, setup event listeners) */
    initialize(emitter: AppKitEmitter, networkManager: NetworkManager): Promise<void>;

    /** Cleanup connector resources */
    destroy(): void;

    /** Connect a wallet */
    connectWallet(network?: Network): Promise<void>;

    /** Disconnect a wallet */
    disconnectWallet(): Promise<void>;

    /** Get connected wallets */
    getConnectedWallets(): WalletInterface[];
}

export interface ConnectorMetadata {
    name: string;
    iconUrl?: string;
}
