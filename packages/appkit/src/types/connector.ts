/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

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

    /** Cleanup connector resources */
    destroy(): void;

    /** Connect a wallet */
    connectWallet(): Promise<void>;

    /** Disconnect a wallet */
    disconnectWallet(): Promise<void>;

    /** Get connected wallets */
    getConnectedWallets(): WalletInterface[];
}

export interface ConnectorMetadata {
    name: string;
    iconUrl?: string;
}

export type CreateConnectorFn = (config: { emitter: AppKitEmitter; ssr?: boolean }) => Connector;

export function createConnector(createConnectorFn: CreateConnectorFn): CreateConnectorFn {
    return createConnectorFn;
}
