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
 * Wallet connector contract — the protocol-specific bridge (TonConnect, embedded wallet, …) AppKit drives once you register it via `AppKitConfig.connectors`.
 *
 * @public
 * @category Type
 * @section Connectors and wallets
 */
export interface Connector {
    /** Stable connector identifier, unique within an AppKit instance. */
    readonly id: string;

    /** Protocol type (e.g. `'tonconnect'`). Multiple connectors can share the same type. */
    readonly type: string;

    /** Display metadata (name, icon) shown in connect UIs. */
    readonly metadata: ConnectorMetadata;

    /** Release any resources held by the connector. Call on app teardown. */
    destroy(): void;

    /** Initiate a wallet connection flow on the given network. */
    connectWallet(network?: Network): Promise<void>;

    /** Disconnect the currently connected wallet, if any. */
    disconnectWallet(): Promise<void>;

    /** Wallets currently connected through this connector. */
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
    eventEmitter: AppKitEmitter;
    ssr?: boolean;
}

/** Factory function that creates a connector from context */
export type ConnectorFactory = (ctx: ConnectorFactoryContext) => Connector;

/** A connector instance or a factory that creates one */
export type ConnectorInput = Connector | ConnectorFactory;

/** Helper for creating typed connector factories */
export const createConnector = (factory: ConnectorFactory): ConnectorFactory => {
    return factory;
};
