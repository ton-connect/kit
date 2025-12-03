/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Store
export { createWalletStore } from './store/createWalletStore';
export type { CreateWalletStoreOptions } from './store/createWalletStore';

// Storages
export { AsyncStorageAdapter, ExtensionStorageAdapter, LocalStorageAdapter } from './adapters/storage';

// Provider
export { WalletProvider, WalletStoreContext } from './providers/WalletProvider';
export type { WalletProviderProps } from './providers/WalletProvider';

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
} from './hooks/useWalletStore';

// Types
export type {
    AppState,
    AuthSlice,
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
} from './types/wallet';

// Utils (optional exports)
export * from './utils';
