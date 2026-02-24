/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * TonConnect Feature Entry Point
 *
 * This module contains all TonConnect-related functionality.
 * Import from '@ton/appkit/tonconnect' to use TonConnect features.
 *
 * This is a separate entry point to allow tree-shaking for users
 * who don't need TonConnect functionality.
 *
 * @example
 * ```ts
 * import { TonConnectConnector, TonConnectWalletWrapper } from '@ton/appkit/tonconnect';
 * ```
 */

// Adapter exports
export { TonConnectWalletAdapter } from './adapters/ton-connect-wallet-adapter';
export type { TonConnectWalletAdapterConfig } from './adapters/ton-connect-wallet-adapter';

// Connector exports
export { TonConnectConnector } from './connectors/ton-connect-connector';
export { TONCONNECT_DEFAULT_CONNECTOR_ID } from './constants/id';
export type { TonConnectConnectorConfig } from './connectors/ton-connect-connector';
