/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Store
export { createWalletStore } from './store/create-wallet-store';
export type { CreateWalletStoreOptions } from './store/create-wallet-store';

// Storages
export { AsyncStorageAdapter, ExtensionStorageAdapter, LocalStorageAdapter } from './adapters/storage';

// Provider
export { WalletProvider, WalletStoreContext } from './providers/wallet-provider';
export type { WalletProviderProps } from './providers/wallet-provider';

// Hooks
export {
    useWalletStore,
    useWalletKit,
    useAuth,
    useWallet,
    useTonConnect,
    useTransactionRequests,
    useSignDataRequests,
    useDisconnectEvents,
    useNfts,
    useJettons,
} from './hooks/use-wallet-store';
export { useFormattedTonBalance, useFormattedAmount } from './hooks/use-formatted-balance';
export { useWalletInitialization } from './hooks/use-wallet-initialization';
export type { WalletInitializationState } from './hooks/use-wallet-initialization';

// Types
export type {
    AppState,
    WalletCoreSlice,
    WalletManagementSlice,
    TonConnectSlice,
    JettonsSlice,
    NftsSlice,
} from './types/store';

export type {
    SavedWallet,
    AuthState,
    PreviewTransaction,
    DisconnectNotification,
    QueuedRequest,
    QueuedRequestData,
    RequestQueue,
    LedgerConfig,
    WalletKitConfig,
    CreateLedgerTransportFunction,
} from './types/wallet';

// Utils (optional exports)
export * from './utils';
