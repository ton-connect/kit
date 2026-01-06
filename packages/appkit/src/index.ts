/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// AppKit - Bridge between @tonconnect/sdk and TonWalletKit
// Allows dApps to use TonConnect wallets with TonWalletKit-compatible interface

export { AppKitImpl as AppKit } from './AppKit';
export { TonConnectWalletWrapperImpl as TonConnectWalletWrapper } from './TonConnectWalletWrapper';

// Export types
export type { AppKitConfig, AppKit as IAppKit, TonConnectWalletWrapper as ITonConnectWalletWrapper } from './types';

// Re-export commonly used types from dependencies
export type { Wallet } from '@tonconnect/sdk';
export type {
    TonWalletKit,
    Wallet as WalletInterface,
    TONTransferRequest,
    JettonsTransferRequest,
    TransactionRequest,
} from '@ton/walletkit';
