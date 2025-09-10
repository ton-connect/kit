import type { StateCreator } from 'zustand';
import type {
    WalletInterface,
    EventConnectRequest,
    EventTransactionRequest,
    EventSignDataRequest,
    EventDisconnect,
    AddressJetton,
    JettonTransfer,
    JettonInfo,
    JettonBalance,
} from '@ton/walletkit';

import type { AuthState, WalletState, Transaction } from './wallet';

// Auth slice interface
export interface AuthSlice extends AuthState {
    // Actions
    setPassword: (password: string) => Promise<void>;
    unlock: (password: string) => Promise<boolean>;
    lock: () => void;
    reset: () => void;
    setPersistPassword: (persist: boolean) => void;
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
    loadJettonTransfers: (userAddress?: string, jettonAddress?: string) => Promise<void>;
    loadPopularJettons: () => Promise<void>;
    searchJettons: (query: string) => Promise<JettonInfo[]>;
    getJettonBalance: (jettonWalletAddress: string) => Promise<JettonBalance>;
    validateJettonAddress: (address: string) => boolean;
    clearJettons: () => void;

    // Utility methods
    getJettonByAddress: (jettonAddress: string) => AddressJetton | undefined;
    formatJettonAmount: (amount: string, decimals: number) => string;
}

// Wallet slice interface
export interface WalletSlice extends WalletState {
    // Actions
    createWallet: (mnemonic: string[]) => Promise<void>;
    importWallet: (mnemonic: string[]) => Promise<void>;
    loadWallet: () => Promise<void>;
    clearWallet: () => void;
    updateBalance: () => Promise<void>;
    addTransaction: (transaction: Transaction) => void;

    // TON Connect actions
    handleTonConnectUrl: (url: string) => Promise<void>;
    showConnectRequest: (request: EventConnectRequest) => void;
    approveConnectRequest: (selectedWallet: WalletInterface) => Promise<void>;
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

    // Getters
    getDecryptedMnemonic: () => Promise<string[] | null>;
    getAvailableWallets: () => WalletInterface[];
}

// Combined app state
export interface AppState extends AuthSlice, WalletSlice, JettonsSlice {}

// Slice creator types
export type AuthSliceCreator = StateCreator<AppState, [], [], AuthSlice>;

export type WalletSliceCreator = StateCreator<AppState, [], [], WalletSlice>;

export type JettonsSliceCreator = StateCreator<AppState, [], [], JettonsSlice>;

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
