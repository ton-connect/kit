/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * TonConnect entry point. Import from `@ton/appkit/tonconnect`. It's kept as a separate * entry so apps that don't use TonConnect can tree-shake it out.
 *
 * @example
 * ```ts
 * import { createTonConnectConnector, TonConnectWalletAdapter } from '@ton/appkit/tonconnect';
 * ```
 */

// Adapter exports
export { TonConnectWalletAdapter } from './adapters/ton-connect-wallet-adapter';
export type { TonConnectWalletAdapterConfig } from './adapters/ton-connect-wallet-adapter';

// Connector exports
export {
    createTonConnectConnector,
    type TonConnectConnectorConfig,
    type TonConnectConnector,
} from './connectors/ton-connect-connector';
export { TONCONNECT_DEFAULT_CONNECTOR_ID } from './constants/id';
