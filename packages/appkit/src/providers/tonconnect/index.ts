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
 * import { TonConnectProvider, TonConnectWalletWrapper } from '@ton/appkit/tonconnect';
 * ```
 */

// Adapter exports
export { TonConnectWalletWrapperImpl as TonConnectWalletWrapper } from './adapters/ton-connect-wallet-wrapper';
export type { TonConnectWalletWrapperConfig } from './adapters/ton-connect-wallet-wrapper';

// Provider exports
export { TonConnectProvider } from './providers/ton-connect-provider';
export type { TonConnectProviderConfig } from './providers/ton-connect-provider';

// Type exports
export type { TonConnectWalletWrapper as ITonConnectWalletWrapper, WalletConnectionInfo } from './types/wallet';
