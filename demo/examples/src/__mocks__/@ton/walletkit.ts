/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { vi } from 'vitest';

// Types
export type DeviceInfo = {
    platform: string;
    appName: string;
    appVersion: string;
    maxProtocolVersion: number;
    features: unknown[];
};

export type WalletInfo = {
    name: string;
    appName: string;
    imageUrl: string;
    bridgeUrl: string;
    universalLink: string;
    aboutUrl: string;
    platforms: string[];
};

export type ConnectionRequestEvent = {
    preview: {
        dAppInfo?: {
            name?: string;
            description?: string;
            iconUrl?: string;
        };
        permissions?: Array<{ title: string; description: string }>;
    };
    dAppInfo?: { name?: string };
    walletId?: string;
    walletAddress?: string;
};

export type TransactionRequestEvent = {
    preview: unknown;
};

export type SignDataRequestEvent = {
    preview: unknown;
};

export type DisconnectionEvent = {
    walletAddress: string;
};

export type TransactionEmulatedPreview = {
    result: (typeof Result)[keyof typeof Result];
    error?: { message: string };
    moneyFlow?: {
        ourTransfers: TransactionTraceMoneyFlowItem[];
    };
};

export type TransactionTraceMoneyFlowItem = {
    assetType: 'ton' | 'jetton' | 'nft';
    amount: string;
    tokenAddress?: string;
};

export type SignDataPreview = {
    type: 'text' | 'binary' | 'cell';
    value: {
        content: string;
        schema?: string;
        parsed?: unknown;
    };
};

export type TONTransferRequest = {
    recipientAddress: string;
    transferAmount: string;
    comment?: string;
    body?: string;
};

export type JettonsTransferRequest = {
    recipientAddress: string;
    jettonAddress: string;
    transferAmount: string;
    comment?: string;
};

export type NFTTransferRequest = {
    nftAddress: string;
    recipientAddress: string;
    transferAmount: string;
    comment?: string;
};

// Constants
export const CHAIN = {
    MAINNET: '-239',
    TESTNET: '-3',
} as const;

export const AssetType = {
    ton: 'ton',
    jetton: 'jetton',
    nft: 'nft',
} as const;

export const Result = {
    success: 'success',
    failure: 'failure',
} as const;

// Mock wallet instance
const createMockWallet = () => ({
    getWalletId: vi.fn(() => 'mock-wallet-id'),
    getAddress: vi.fn(() => 'EQMockAddress123'),
    getBalance: vi.fn(() => Promise.resolve(1000000000n)),
    createTransferTonTransaction: vi.fn(() => Promise.resolve({ messages: [] })),
    createTransferJettonTransaction: vi.fn(() => Promise.resolve({ messages: [] })),
    createTransferNftTransaction: vi.fn(() => Promise.resolve({ messages: [] })),
    getNfts: vi.fn(() => Promise.resolve({ nfts: [] })),
});

// Store handlers globally so tests can access them
export const mockHandlers: {
    connect?: (event: ConnectionRequestEvent) => void | Promise<void>;
    transaction?: (event: TransactionRequestEvent) => void | Promise<void>;
    signData?: (event: SignDataRequestEvent) => void | Promise<void>;
    disconnect?: (event: DisconnectionEvent) => void;
} = {};

// Mock TonWalletKit
export class TonWalletKit {
    private wallets: ReturnType<typeof createMockWallet>[] = [];

    constructor(_config: unknown) {
        this.wallets = [createMockWallet()];
    }

    waitForReady = vi.fn(() => Promise.resolve());
    close = vi.fn(() => Promise.resolve());
    getStatus = vi.fn(() => ({ ready: true }));
    getConfiguredNetworks = vi.fn(() => ['-239']);
    getApiClient = vi.fn(() => ({}));

    getWallets = vi.fn(() => [...this.wallets]);
    getWallet = vi.fn((idOrAddress: string) => {
        if (!idOrAddress) return undefined;
        const byId = this.wallets.find((w) => w.getWalletId() === idOrAddress);
        if (byId) return byId;
        const byAddress = this.wallets.find((w) => w.getAddress() === idOrAddress);
        return byAddress ?? this.wallets[0];
    });
    addWallet = vi.fn(() => {
        const wallet = createMockWallet();
        this.wallets.push(wallet);
        return Promise.resolve(wallet);
    });

    onConnectRequest = vi.fn((handler: (event: ConnectionRequestEvent) => void | Promise<void>) => {
        mockHandlers.connect = handler;
    });
    onTransactionRequest = vi.fn((handler: (event: TransactionRequestEvent) => void | Promise<void>) => {
        mockHandlers.transaction = handler;
    });
    onSignDataRequest = vi.fn((handler: (event: SignDataRequestEvent) => void | Promise<void>) => {
        mockHandlers.signData = handler;
    });
    onDisconnect = vi.fn((handler: (event: DisconnectionEvent) => void) => {
        mockHandlers.disconnect = handler;
    });

    approveConnectRequest = vi.fn(() => Promise.resolve());
    rejectConnectRequest = vi.fn(() => Promise.resolve());
    approveTransactionRequest = vi.fn(() => Promise.resolve());
    rejectTransactionRequest = vi.fn(() => Promise.resolve());
    approveSignDataRequest = vi.fn(() => Promise.resolve());
    rejectSignDataRequest = vi.fn(() => Promise.resolve());

    handleTonConnectUrl = vi.fn(() => Promise.resolve());
    handleNewTransaction = vi.fn(() => Promise.resolve());

    jettons = {
        getJettonInfo: vi.fn(() => ({ name: 'Test Jetton', symbol: 'TJ', image: 'https://example.com/image.png' })),
    };
}

// Mock Signer
export const Signer = {
    fromMnemonic: vi.fn(() =>
        Promise.resolve({
            sign: vi.fn(),
            getPublicKey: vi.fn(() => Buffer.from('mock-public-key')),
        }),
    ),
};

// Mock WalletV5R1Adapter
export const WalletV5R1Adapter = {
    create: vi.fn(() =>
        Promise.resolve({
            getAddress: vi.fn(() => 'EQMockV5R1Address'),
        }),
    ),
};

export const Network = {
    mainnet: () => ({ chain: CHAIN.MAINNET }),
    testnet: () => ({ chain: CHAIN.TESTNET }),
} as const;

// Mock MemoryStorageAdapter
export class MemoryStorageAdapter {
    private storage: Record<string, string> = {};

    constructor(initial: Record<string, string>) {
        this.storage = initial;
    }

    get = vi.fn((key: string) => Promise.resolve(this.storage[key] ?? null));
    set = vi.fn((key: string, value: string) => {
        this.storage[key] = value;
        return Promise.resolve();
    });
    delete = vi.fn((key: string) => {
        delete this.storage[key];
        return Promise.resolve();
    });
}

// Helper functions
export const createDeviceInfo = vi.fn(
    (config: Partial<DeviceInfo>): DeviceInfo => ({
        platform: config.platform ?? 'linux',
        appName: config.appName ?? 'TestApp',
        appVersion: config.appVersion ?? '1.0.0',
        maxProtocolVersion: config.maxProtocolVersion ?? 2,
        features: config.features ?? [],
    }),
);

export const createWalletManifest = vi.fn(
    (config: Partial<WalletInfo>): WalletInfo => ({
        name: config.name ?? 'test_wallet',
        appName: config.appName ?? 'TestWallet',
        imageUrl: config.imageUrl ?? 'https://example.com/logo.png',
        bridgeUrl: config.bridgeUrl ?? 'https://bridge.example.com',
        universalLink: config.universalLink ?? 'https://example.com/ton-connect',
        aboutUrl: config.aboutUrl ?? 'https://example.com',
        platforms: config.platforms ?? ['linux'],
    }),
);
