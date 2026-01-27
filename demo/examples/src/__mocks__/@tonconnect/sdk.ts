/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { vi } from 'vitest';

// Mock TonConnect wallet
export interface Wallet {
    account: {
        address: string;
        chain: string;
        walletStateInit: string;
        publicKey?: string;
    };
    device: {
        appName: string;
        appVersion: string;
        platform: string;
    };
}

// Mock ITonConnect interface
export interface ITonConnect {
    sendTransaction: ReturnType<typeof vi.fn>;
    wallet: Wallet | null;
}

// Mock wallet instance
export const mockWallet: Wallet = {
    account: {
        address: 'EQMockTonConnectAddress',
        chain: '-239',
        walletStateInit: 'mock-state-init',
        publicKey: 'mock-public-key',
    },
    device: {
        appName: 'TestWallet',
        appVersion: '1.0.0',
        platform: 'browser',
    },
};

// Mock TonConnect instance
export const mockTonConnect: ITonConnect = {
    sendTransaction: vi.fn(() => Promise.resolve({ boc: 'mock-boc' })),
    wallet: mockWallet,
};
