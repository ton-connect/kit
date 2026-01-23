/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// AppKit - Bridge between @tonconnect/sdk and TonWalletKit
// Allows dApps to use TonConnect wallets with TonWalletKit-compatible interface

// Adapter exports
export { TonConnectWalletWrapperImpl as TonConnectWalletWrapper } from './adapters';
export type { TonConnectWalletWrapperConfig } from './adapters';

// Type exports
export type {
    // Config types
    AppKitConfig,
    AppKitDependencies,
    // Wallet types
    TonConnectWalletWrapper as ITonConnectWalletWrapper,
    WalletConnectionInfo,
    // AppKit types
    AppKit,
    TransactionResult,
} from './types';

// Utility exports (for advanced usage)
export {
    toTonConnectTransaction,
    toTonConnectMessage,
    getValidUntil,
    DEFAULT_TRANSACTION_VALIDITY_SECONDS,
} from './utils';

// Re-export from @tonconnect/sdk
export type { Wallet } from '@tonconnect/sdk';
export type {
    TonWalletKit,
    Wallet as WalletInterface,
    TONTransferRequest,
    JettonsTransferRequest,
    TransactionRequest,
} from '@ton/walletkit';

export { CreateAppKit } from './core/app-kit';

// Core exports
export * from './core/events';
export * from './providers/ton-connect-provider';

// Provider types
export type { WalletProvider } from './types';
