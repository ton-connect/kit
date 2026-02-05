/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * AppKit - Core wallet management for TON dApps
 *
 * This is the main entry point for AppKit. It provides provider-agnostic
 * wallet management functionality.
 *
 * For TonConnect support, import from '@ton/appkit/tonconnect' separately.
 * This allows tree-shaking for users who don't need TonConnect.
 *
 * @example
 * ```ts
 * // Core AppKit (provider-agnostic)
 * import { AppKit } from '@ton/appkit';
 *
 * // TonConnect feature (optional, for tree-shaking)
 * import { TonConnectConnector } from '@ton/appkit/tonconnect';
 * ```
 */

// Core
export * from './core/app-kit';
export * from './core/emitter';

// Actions
// Actions
export * from './actions';

// Queries
export * from './queries';

// Types
export * from './types/connector';
export * from './types/balance';
export * from './types/wallet';
export * from './types/query';
export * from './types/utils';

// Utils
export * from './utils';

// Re-export from @ton/walletkit for convenience
export type { TonWalletKit, TONTransferRequest, JettonsTransferRequest, TransactionRequest } from '@ton/walletkit';
