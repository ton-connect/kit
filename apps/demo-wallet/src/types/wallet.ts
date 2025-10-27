/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    EventConnectRequest,
    EventTransactionRequest,
    EventSignDataRequest,
    IWallet,
    ITonWalletKit,
} from '@ton/walletkit';

export interface SavedWallet {
    id: string; // Unique identifier
    name: string; // User-friendly name
    address: string;
    publicKey: string;
    encryptedMnemonic?: string; // For mnemonic-based wallets
    ledgerConfig?: LedgerConfig; // For Ledger wallets
    walletType: 'mnemonic' | 'signer' | 'ledger';
    walletInterfaceType: 'signer' | 'mnemonic' | 'ledger'; // How the wallet interfaces with signing
    version?: 'v5r1' | 'v4r2'; // Wallet version
    createdAt: number;
}

export interface WalletState {
    wallet: {
        // WalletKit instance
        walletKit: ITonWalletKit | null;

        isAuthenticated: boolean;
        hasWallet: boolean;

        // Multiple saved wallets
        savedWallets: SavedWallet[];
        activeWalletId?: string; // ID of currently active wallet

        // Active wallet info (computed from savedWallets[activeWalletId])
        address?: string;
        balance?: string;
        publicKey?: string;

        // Transaction history for active wallet
        transactions: PreviewTransaction[];

        // Walletkit instance and current wallet
        currentWallet?: IWallet;

        // Connect request state
        pendingConnectRequest?: EventConnectRequest;
        isConnectModalOpen: boolean;

        // Transaction request state
        pendingTransactionRequest?: EventTransactionRequest;
        isTransactionModalOpen: boolean;

        // Sign data request state
        pendingSignDataRequest?: EventSignDataRequest;
        isSignDataModalOpen: boolean;

        // Disconnect notifications
        disconnectedSessions: DisconnectNotification[];
    };
}

export interface AuthState {
    auth: {
        currentPassword?: string;
        passwordHash?: number[]; // Store password hash in state
        isPasswordSet?: boolean;
        isUnlocked?: boolean;
        persistPassword?: boolean; // Setting to persist password between reloads
        holdToSign?: boolean; // Setting to require holding button to sign transactions
        useWalletInterfaceType?: 'signer' | 'mnemonic' | 'ledger'; // Setting for wallet interface type
        ledgerAccountNumber?: number; // Account number for Ledger derivation path
        network?: 'mainnet' | 'testnet'; // Network selection (mainnet or testnet)
    };
}

export interface PreviewTransaction {
    id: string;
    messageHash: string;
    type: 'send' | 'receive';
    amount: string;
    address: string;
    timestamp: number;
    status: 'pending' | 'confirmed' | 'failed';
    traceId?: string;
    externalMessageHash?: string;
}

export interface DisconnectNotification {
    walletAddress: string;
    reason?: string;
    timestamp: number;
}

export interface LedgerConfig {
    publicKey: string; // Store as number array for JSON serialization
    path: number[];
    walletId: number;
    version: string;
    network: string; // Store as string for JSON serialization
    workchain: number;
    accountIndex: number;
}
