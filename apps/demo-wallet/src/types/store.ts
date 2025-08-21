import type { StateCreator } from 'zustand';
import type { WalletInterface, EventConnectRequest } from '@ton/walletkit';

import type { AuthState, WalletState, Transaction } from './wallet';

// Auth slice interface
export interface AuthSlice extends AuthState {
    // Actions
    setPassword: (password: string) => Promise<void>;
    unlock: (password: string) => Promise<boolean>;
    lock: () => void;
    reset: () => void;
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

    // Getters
    getDecryptedMnemonic: () => Promise<string[] | null>;
    getAvailableWallets: () => WalletInterface[];
}

// Combined app state
export interface AppState extends AuthSlice, WalletSlice {}

// Slice creator types
export type AuthSliceCreator = StateCreator<AppState, [], [], AuthSlice>;

export type WalletSliceCreator = StateCreator<AppState, [], [], WalletSlice>;

// Migration types
export interface MigrationState {
    version: number;
    [key: string]: unknown;
}

export type MigrationFunction = (persistedState: unknown, version: number) => unknown;

type DeepPartial<T> = T extends object
    ? {
          [P in keyof T]?: DeepPartial<T[P]>;
      }
    : T;

export type SetState = {
    (state: AppState | Partial<AppState>): void;
    (updater: (state: AppState) => void): void;
};
