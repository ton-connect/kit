import type {
    EventConnectRequest,
    EventTransactionRequest,
    EventSignDataRequest,
    WalletInterface,
    ITonWalletKit,
} from '@ton/walletkit';

export interface WalletState {
    wallet: {
        // WalletKit instance
        walletKit: ITonWalletKit | null;

        isAuthenticated: boolean;
        hasWallet: boolean;
        address?: string;
        balance?: string;
        mnemonic?: string[];
        publicKey?: string;

        // Transaction history
        transactions: PreviewTransaction[];

        // Walletkit instance and current wallet
        currentWallet?: WalletInterface;

        // Connect request state
        pendingConnectRequest?: EventConnectRequest;
        isConnectModalOpen: boolean;

        // Transaction request state
        pendingTransactionRequest?: EventTransactionRequest;
        isTransactionModalOpen: boolean;

        // Sign data request state
        pendingSignDataRequest?: EventSignDataRequest;
        isSignDataModalOpen: boolean;

        // Encrypted mnemonic stored in state
        encryptedMnemonic?: string;

        // Ledger configuration for re-initialization without device connection
        ledgerConfig?: LedgerConfig;

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
    publicKey: number[]; // Store as number array for JSON serialization
    path: number[];
    walletId: number;
    version: string;
    network: string; // Store as string for JSON serialization
    workchain: number;
    accountIndex: number;
}
