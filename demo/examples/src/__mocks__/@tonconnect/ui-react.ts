/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { vi } from 'vitest';

// Mock wallet for useTonWallet
export const mockWallet = {
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

// Mock TonConnectUI
export const mockTonConnectUI = {
    connector: {
        sendTransaction: vi.fn(() => Promise.resolve({ boc: 'mock-boc' })),
        wallet: mockWallet,
    },
    disconnect: vi.fn(() => Promise.resolve()),
};

// Mock hooks
export const useTonConnectUI = vi.fn(() => [mockTonConnectUI]);
export const useTonWallet = vi.fn(() => mockWallet);
export const useTonAddress = vi.fn(() => 'EQMockTonConnectAddress');
