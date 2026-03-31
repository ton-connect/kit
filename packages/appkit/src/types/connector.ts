/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { WalletInterface } from './wallet';
import type { AppKitEmitter } from '../core/app-kit';
import type { AppKitNetworkManager } from '../core/network';
import type { Network } from './network';

/**
 * Interface for wallet connectors
 */
export interface Connector {
    /** Provider unique identifier */
    readonly id: string;

    /** Protocol type (e.g. 'tonconnect') */
    readonly type: string;

    readonly metadata: ConnectorMetadata;

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

export type CreateConnectorFn = (config: {
    emitter: AppKitEmitter;
    networkManager: AppKitNetworkManager;
    ssr?: boolean;
}) => Connector;

export function createConnector(createConnectorFn: CreateConnectorFn): CreateConnectorFn {
    return createConnectorFn;
}
