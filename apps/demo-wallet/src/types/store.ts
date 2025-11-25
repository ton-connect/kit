/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StateCreator } from 'zustand';
import type {
    IWallet,
    EventConnectRequest,
    EventTransactionRequest,
    EventSignDataRequest,
    EventDisconnect,
    AddressJetton,
    JettonTransfer,
    JettonInfo,
    NftItem,
    ITonWalletKit,
} from '@ton/walletkit';

import type {
    AuthState,
    WalletState,
    PreviewTransaction,
    SavedWallet,
    QueuedRequest,
    QueuedRequestData,
} from './wallet';

// Auth slice interface
export interface AuthSlice extends AuthState {
    // Actions
    setPassword: (password: string) => Promise<void>;
    unlock: (password: string) => Promise<boolean>;
    lock: () => void;
    reset: () => void;
    setPersistPassword: (persist: boolean) => void;
    setHoldToSign: (enabled: boolean) => void;
    setUseWalletInterfaceType: (interfaceType: 'signer' | 'mnemonic' | 'ledger') => void;
    setLedgerAccountNumber: (accountNumber: number) => void;
    setNetwork: (network: 'mainnet' | 'testnet') => Promise<void>;
}

// Jettons slice interface
export interface JettonsSlice {
    jettons: {
        // Data
        userJettons: AddressJetton[];
        jettonTransfers: JettonTransfer[];
        popularJettons: JettonInfo[];

        // Loading states
        isLoadingJettons: boolean;
        isLoadingTransfers: boolean;
        isLoadingPopular: boolean;
        isRefreshing: boolean;

        // Error states
        error: string | null;
        transferError: string | null;

        // Last update timestamps
        lastJettonsUpdate: number;
        lastTransfersUpdate: number;
        lastPopularUpdate: number;
    };

    // Actions
    loadUserJettons: (userAddress?: string) => Promise<void>;
    refreshJettons: (userAddress?: string) => Promise<void>;
    validateJettonAddress: (address: string) => boolean;
    clearJettons: () => void;

    // Utility methods
    getJettonByAddress: (jettonAddress: string) => AddressJetton | undefined;
    formatJettonAmount: (amount: string, decimals: number) => string;
}

// NFTs slice interface
export interface NftsSlice {
    nfts: {
        // Data
        userNfts: NftItem[];

        // Loading states
        isLoadingNfts: boolean;
        isRefreshing: boolean;

        // Error states
        error: string | null;

        // Last update timestamp
        lastNftsUpdate: number;

        // Pagination
        hasMore: boolean;
        offset: number;
    };

    // Actions
    loadUserNfts: (userAddress?: string, limit?: number) => Promise<void>;
    refreshNfts: (userAddress?: string) => Promise<void>;
    loadMoreNfts: (userAddress?: string) => Promise<void>;
    clearNfts: () => void;

    // Utility methods
    getNftByAddress: (address: string) => NftItem | undefined;
    formatNftIndex: (index: string) => string;
}

// Wallet slice interface
export interface WalletSlice extends WalletState {
    // WalletKit initialization
    initializeWalletKit: (network?: 'mainnet' | 'testnet') => Promise<void>;

    // Multi-wallet actions
    createWallet: (mnemonic: string[], name?: string, version?: 'v5r1' | 'v4r2') => Promise<string>; // Returns wallet ID
    importWallet: (mnemonic: string[], name?: string, version?: 'v5r1' | 'v4r2') => Promise<string>; // Returns wallet ID
    createLedgerWallet: (name?: string) => Promise<string>; // Returns wallet ID
    switchWallet: (walletId: string) => Promise<void>;
    removeWallet: (walletId: string) => void;
    renameWallet: (walletId: string, newName: string) => void;
    loadAllWallets: () => Promise<void>;
    loadSavedWalletsIntoKit: (walletKit: ITonWalletKit) => Promise<void>;

    // Legacy actions (for backward compatibility)
    loadWallet: () => Promise<void>;
    clearWallet: () => void;
    updateBalance: () => Promise<void>;
    addTransaction: (transaction: PreviewTransaction) => void;
    loadTransactions: (limit?: number) => Promise<void>;

    // TON Connect actions
    handleTonConnectUrl: (url: string) => Promise<void>;
    showConnectRequest: (request: EventConnectRequest) => void;
    approveConnectRequest: (selectedWallet: IWallet) => Promise<void>;
    rejectConnectRequest: (reason?: string) => Promise<void>;
    closeConnectModal: () => void;

    // Transaction request actions
    showTransactionRequest: (request: EventTransactionRequest) => void;
    approveTransactionRequest: () => Promise<void>;
    rejectTransactionRequest: (reason?: string) => Promise<void>;
    closeTransactionModal: () => void;

    // Sign data request actions
    showSignDataRequest: (request: EventSignDataRequest) => void;
    approveSignDataRequest: () => Promise<void>;
    rejectSignDataRequest: (reason?: string) => Promise<void>;
    closeSignDataModal: () => void;

    // Disconnect event actions
    handleDisconnectEvent: (event: EventDisconnect) => void;
    clearDisconnectNotifications: () => void;

    // Queue management
    enqueueRequest: (request: QueuedRequestData) => void;
    processNextRequest: () => void;
    clearExpiredRequests: () => void;
    getCurrentRequest: () => QueuedRequest | undefined;

    // Getters
    getDecryptedMnemonic: (walletId?: string) => Promise<string[] | null>;
    getAvailableWallets: () => IWallet[];
    getActiveWallet: () => SavedWallet | undefined;

    clearCurrentRequestFromQueue: () => void;
}

// Combined app state
export interface AppState extends AuthSlice, WalletSlice, JettonsSlice, NftsSlice {}

// Slice creator types
export type AuthSliceCreator = StateCreator<AppState, [], [], AuthSlice>;

export type WalletSliceCreator = StateCreator<AppState, [], [], WalletSlice>;

export type JettonsSliceCreator = StateCreator<AppState, [], [], JettonsSlice>;

export type NftsSliceCreator = StateCreator<AppState, [], [], NftsSlice>;

// Migration types
export interface MigrationState {
    version: number;
    [key: string]: unknown;
}

export type MigrationFunction = (persistedState: unknown, version: number) => unknown;

// type DeepPartial<T> = T extends object
//     ? {
//           [P in keyof T]?: DeepPartial<T[P]>;
//       }
//     : T;

export type SetState = {
    (state: AppState | Partial<AppState>): void;
    (updater: (state: AppState) => void): void;
};
