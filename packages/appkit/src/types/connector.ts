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

/**
 * Context passed to connector factory functions.
 */
export interface ConnectorFactoryContext {
    networkManager: AppKitNetworkManager;
    emitter: AppKitEmitter;
    ssr?: boolean;
}

/** Factory function that creates a connector from context */
export type ConnectorFactory = (ctx: ConnectorFactoryContext) => Connector;

/** A connector instance or a factory that creates one */
export type ConnectorInput = Connector | ConnectorFactory;

/** Helper for creating typed connector factories */
export function createConnector(factory: ConnectorFactory): ConnectorFactory {
    return factory;
}
