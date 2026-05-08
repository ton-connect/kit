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
 * Wallet connector contract — the protocol-specific bridge (TonConnect, embedded wallet, …) AppKit drives once you register it via {@link AppKitConfig}`.connectors`.
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

/**
 * Display metadata for a {@link Connector}, surfaced in connect UIs to help users pick the right wallet.
 *
 * @public
 * @category Type
 * @section Connectors and wallets
 */
export interface ConnectorMetadata {
    /** Human-readable connector name (e.g., `'TonConnect'`). */
    name: string;
    /** Optional URL of an icon shown next to the name. */
    iconUrl?: string;
}

/**
 * Context that AppKit injects into a {@link ConnectorFactory} when building the connector at registration time.
 *
 * @public
 * @category Type
 * @section Connectors and wallets
 */
export interface ConnectorFactoryContext {
    /** Network manager the connector should use for client lookups and default-network reads. */
    networkManager: AppKitNetworkManager;
    /** Event emitter the connector should publish wallet/connection events to. */
    eventEmitter: AppKitEmitter;
    /** `true` when the connector is constructed during server-side rendering — connectors may skip browser-only setup. */
    ssr?: boolean;
}

/**
 * Factory that builds a {@link Connector} from {@link ConnectorFactoryContext}; AppKit calls it at registration time.
 *
 * @public
 * @category Type
 * @section Connectors and wallets
 */
export type ConnectorFactory = (ctx: ConnectorFactoryContext) => Connector;

/**
 * Either a ready-made {@link Connector} or a {@link ConnectorFactory} that produces one — the value accepted by {@link addConnector} and {@link AppKitConfig}`.connectors`.
 *
 * @public
 * @category Type
 * @section Connectors and wallets
 */
export type ConnectorInput = Connector | ConnectorFactory;

/**
 * Identity helper for typing a {@link ConnectorFactory} inline — returns the factory unchanged so authors get parameter inference without spelling the type out.
 *
 * @param factory - {@link ConnectorFactory} Factory to wrap.
 * @returns The same factory, typed as {@link ConnectorFactory}.
 *
 * @public
 * @category Action
 * @section Connectors and wallets
 */
export const createConnector = (factory: ConnectorFactory): ConnectorFactory => {
    return factory;
};
