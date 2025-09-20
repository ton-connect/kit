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
    WalletInterface,
    TonTransferParams,
    TonTransferManyParams,
    JettonTransferParams,
    ConnectTransactionParamContent,
} from '@ton/walletkit';
