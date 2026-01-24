/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { vi } from 'vitest';
import type { WalletInterface } from '@ton/appkit';

/**
 * MockWrappedWallet is a test double for Wallet.
 * It satisfies the Wallet interface while providing vi.fn() mocks for assertions.
 */
export type MockWrappedWallet = WalletInterface;

// Mock wrapped wallet that implements the full Wallet interface
export const createMockWrappedWallet = (): MockWrappedWallet => {
    // Create a minimal mock ApiClient - only methods actually called in tests need implementations
    const mockClient = {
        nftItemsByAddress: vi.fn(),
        nftItemsByOwner: vi.fn(),
        fetchEmulation: vi.fn(),
        sendBoc: vi.fn(),
        runGetMethod: vi.fn(),
        getAccountState: vi.fn(),
        getBalance: vi.fn(),
        getAccountTransactions: vi.fn(),
        getTransactionsByHash: vi.fn(),
        getPendingTransactions: vi.fn(),
        getTrace: vi.fn(),
        getPendingTrace: vi.fn(),
        resolveDnsWallet: vi.fn(),
        backResolveDnsWallet: vi.fn(),
        jettonsByAddress: vi.fn(),
        jettonsByOwnerAddress: vi.fn(),
        getEvents: vi.fn(),
    };

    const wallet = {
        // WalletAdapter methods
        getPublicKey: vi.fn(() => '0x1234567890abcdef'),
        getNetwork: vi.fn(() => ({ chainId: '-239' })),
        getClient: vi.fn(() => mockClient),
        getAddress: vi.fn(() => 'EQMockAddress123'),
        getWalletId: vi.fn(() => 'mock-wallet-id'),
        getStateInit: vi.fn(() => Promise.resolve('mock-state-init-base64')),
        getSignedSendTransaction: vi.fn(() => Promise.resolve('mock-signed-tx-base64')),
        getSignedSignData: vi.fn(() => Promise.resolve('0xmocksignature')),
        getSignedTonProof: vi.fn(() => Promise.resolve('0xmockproof')),

        // WalletTonInterface methods
        getBalance: vi.fn(() => Promise.resolve(1000000000n)),
        createTransferTonTransaction: vi.fn(() => Promise.resolve({ messages: [] })),
        createTransferMultiTonTransaction: vi.fn(() => Promise.resolve({ messages: [] })),
        getTransactionPreview: vi.fn(() =>
            Promise.resolve({
                risk: { ton: '0', jettons: [], nfts: [] },
                emulatedMessages: [],
            }),
        ),
        sendTransaction: vi.fn(() => Promise.resolve({ boc: 'mock-boc-string' })),

        // WalletJettonInterface methods
        createTransferJettonTransaction: vi.fn(() => Promise.resolve({ messages: [] })),
        getJettonBalance: vi.fn(() => Promise.resolve(1000000000n)),
        getJettonWalletAddress: vi.fn(() => Promise.resolve('EQMockJettonWalletAddress')),
        getJettons: vi.fn(() =>
            Promise.resolve({
                jettons: [
                    {
                        address: 'EQJettonAddress',
                        walletAddress: 'EQJettonWalletAddress',
                        balance: '1000000000',
                        info: { name: 'Test Jetton', symbol: 'TJ' },
                        isVerified: true,
                        prices: [],
                    },
                ],
            }),
        ),

        // WalletNftInterface methods
        createTransferNftTransaction: vi.fn(() => Promise.resolve({ messages: [] })),
        createTransferNftRawTransaction: vi.fn(() => Promise.resolve({ messages: [] })),
        getNfts: vi.fn(() =>
            Promise.resolve({
                nfts: [
                    {
                        address: 'EQNftAddress',
                        info: { name: 'Test NFT' },
                    },
                ],
            }),
        ),
        getNft: vi.fn(() =>
            Promise.resolve({
                address: 'EQNftAddress',
                info: { name: 'Test NFT' },
            }),
        ),

        // ApiClient property
        client: mockClient,
    };
    // Cast through unknown to satisfy branded types (Hex, Base64String)
    // This is necessary for test mocks where we use plain strings instead of branded types
    return wallet as unknown as MockWrappedWallet;
};

// Mock AppKit
export class AppKit {
    public eventBus = {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
    };

    getConnectedWallets = vi.fn().mockReturnValue(Promise.resolve([createMockWrappedWallet()]));
    registerProvider = vi.fn();
    connectWallet = vi.fn();
    disconnectWallet = vi.fn();

    constructor(
        public config: {
            networks?: Record<string, unknown>;
        } = {},
    ) {}
}

// PROVIDER_EVENTS constant
export const PROVIDER_EVENTS = {
    CONNECTED: 'wallet:connected',
    DISCONNECTED: 'wallet:disconnected',
    CHANGED: 'wallet:changed',
} as const;

export default { AppKit };
