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
    PreviewTransaction,
    SavedWallet,
    QueuedRequest,
    QueuedRequestData,
    RequestQueue,
    DisconnectNotification,
} from './wallet';

// Auth slice interface
export interface AuthSlice extends AuthState {
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

// Wallet Core slice - WalletKit initialization and instance management
export interface WalletCoreSlice {
    walletCore: {
        walletKit: ITonWalletKit | null;
        walletKitInitializer: Promise<void> | null;
    };

    initializeWalletKit: (network?: 'mainnet' | 'testnet') => Promise<void>;
}

// Wallet Management slice - Wallet CRUD and data
export interface WalletManagementSlice {
    walletManagement: {
        savedWallets: SavedWallet[];
        activeWalletId?: string;
        address?: string;
        balance?: string;
        publicKey?: string;
        transactions: PreviewTransaction[];
        currentWallet?: IWallet;
        hasWallet: boolean;
        isAuthenticated: boolean;
    };

    // Multi-wallet actions
    createWallet: (mnemonic: string[], name?: string, version?: 'v5r1' | 'v4r2') => Promise<string>;
    importWallet: (mnemonic: string[], name?: string, version?: 'v5r1' | 'v4r2') => Promise<string>;
    createLedgerWallet: (name?: string) => Promise<string>;
    switchWallet: (walletId: string) => Promise<void>;
    removeWallet: (walletId: string) => void;
    renameWallet: (walletId: string, newName: string) => void;
    loadAllWallets: () => Promise<void>;
    loadSavedWalletsIntoKit: (walletKit: ITonWalletKit) => Promise<void>;

    // Wallet state actions
    clearWallet: () => void;
    updateBalance: () => Promise<void>;
    // Events-based history
    addEvent: (event: unknown) => void;
    loadEvents: (limit?: number, offset?: number) => Promise<void>;
    // Legacy compatibility for older UI/hooks
    addTransaction: (transaction: PreviewTransaction) => void;
    loadTransactions: (limit?: number) => Promise<void>;

    // Getters
    getDecryptedMnemonic: (walletId?: string) => Promise<string[] | null>;
    getAvailableWallets: () => IWallet[];
    getActiveWallet: () => SavedWallet | undefined;
}

// TON Connect slice - Connection requests, transactions, signing
export interface TonConnectSlice {
    tonConnect: {
        requestQueue: RequestQueue;
        pendingConnectRequest?: EventConnectRequest;
        isConnectModalOpen: boolean;
        pendingTransactionRequest?: EventTransactionRequest;
        isTransactionModalOpen: boolean;
        pendingSignDataRequest?: EventSignDataRequest;
        isSignDataModalOpen: boolean;
        disconnectedSessions: DisconnectNotification[];
    };

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
    clearCurrentRequestFromQueue: () => void;

    // Setup listeners
    setupTonConnectListeners: (walletKit: ITonWalletKit) => void;
}

// Jettons slice interface
export interface JettonsSlice {
    jettons: {
        userJettons: AddressJetton[];
        jettonTransfers: JettonTransfer[];
        popularJettons: JettonInfo[];
        isLoadingJettons: boolean;
        isLoadingTransfers: boolean;
        isLoadingPopular: boolean;
        isRefreshing: boolean;
        error: string | null;
        transferError: string | null;
        lastJettonsUpdate: number;
        lastTransfersUpdate: number;
        lastPopularUpdate: number;
    };

    loadUserJettons: (userAddress?: string) => Promise<void>;
    refreshJettons: (userAddress?: string) => Promise<void>;
    validateJettonAddress: (address: string) => boolean;
    clearJettons: () => void;
    getJettonByAddress: (jettonAddress: string) => AddressJetton | undefined;
    formatJettonAmount: (amount: string, decimals: number) => string;
}

// NFTs slice interface
export interface NftsSlice {
    nfts: {
        userNfts: NftItem[];
        isLoadingNfts: boolean;
        isRefreshing: boolean;
        error: string | null;
        lastNftsUpdate: number;
        hasMore: boolean;
        offset: number;
    };

    loadUserNfts: (userAddress?: string, limit?: number) => Promise<void>;
    refreshNfts: (userAddress?: string) => Promise<void>;
    loadMoreNfts: (userAddress?: string) => Promise<void>;
    clearNfts: () => void;
    getNftByAddress: (address: string) => NftItem | undefined;
    formatNftIndex: (index: string) => string;
}

// Combined app state
export interface AppState
    extends AuthSlice,
        WalletCoreSlice,
        WalletManagementSlice,
        TonConnectSlice,
        JettonsSlice,
        NftsSlice {}

// Slice creator types
export type AuthSliceCreator = StateCreator<AppState, [], [], AuthSlice>;

export type WalletCoreSliceCreator = StateCreator<AppState, [], [], WalletCoreSlice>;

export type WalletManagementSliceCreator = StateCreator<AppState, [], [], WalletManagementSlice>;

export type TonConnectSliceCreator = StateCreator<AppState, [], [], TonConnectSlice>;

export type JettonsSliceCreator = StateCreator<AppState, [], [], JettonsSlice>;

export type NftsSliceCreator = StateCreator<AppState, [], [], NftsSlice>;

// Migration types
export interface MigrationState {
    version: number;
    [key: string]: unknown;
}

export type MigrationFunction = (persistedState: unknown, version: number) => unknown;

export type SetState = {
    (state: AppState | Partial<AppState>): void;
    (updater: (state: AppState) => void): void;
};
