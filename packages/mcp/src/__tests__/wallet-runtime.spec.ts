/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it, vi } from 'vitest';
import { Network } from '@ton/walletkit';

const mocks = vi.hoisted(() => ({
    getSharedTonWalletKit: vi.fn(),
}));

vi.mock('../runtime/shared-ton-wallet-kit.js', () => ({
    getSharedTonWalletKit: mocks.getSharedTonWalletKit,
}));

import { createAgenticWalletRecord, createStandardWalletRecord } from '../registry/config.js';
import { createMcpWalletServiceFromStoredWallet } from '../runtime/wallet-runtime.js';

describe('createMcpWalletServiceFromStoredWallet', () => {
    it.each([
        createStandardWalletRecord({
            name: 'Broken standard',
            network: 'mainnet',
            walletVersion: 'v5r1',
            address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            signMethod: { type: 'local_file', file_path: 'private-keys/missing.private-key' },
            secretType: 'private_key',
        }),
        createAgenticWalletRecord({
            name: 'Read-only agent',
            network: 'mainnet',
            address: 'EQDSLOFVamNZzdy4LulclcCBEFkRReZ7WscBCLAw3Pg53kAk',
            ownerAddress: 'EQByQ19qvWxW7VibSbGEgZiYMqilHY5y1a_eeSL2VaXhfy07',
        }),
    ])('creates a read-only service without loading secrets for $name', async (wallet) => {
        const getBalance = vi.fn().mockResolvedValue('123');
        mocks.getSharedTonWalletKit.mockResolvedValue({
            getApiClient: vi.fn().mockReturnValue({
                getBalance,
            }),
        });

        const context = await createMcpWalletServiceFromStoredWallet({
            wallet,
            toncenterApiKey: 'runtime-key',
        });

        await expect(context.service.getBalance()).resolves.toBe('123');
        expect(mocks.getSharedTonWalletKit).toHaveBeenCalledWith('mainnet', 'runtime-key');
        expect(getBalance).toHaveBeenCalledWith(wallet.address);
        await expect(context.close()).resolves.toBeUndefined();
    });

    it('builds read-only services with the correct network client', async () => {
        const wallet = createStandardWalletRecord({
            name: 'Testnet wallet',
            network: 'testnet',
            walletVersion: 'v5r1',
            address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        });
        const getApiClient = vi.fn().mockReturnValue({
            getBalance: vi.fn().mockResolvedValue('0'),
        });
        mocks.getSharedTonWalletKit.mockResolvedValue({ getApiClient });

        const context = await createMcpWalletServiceFromStoredWallet({
            wallet,
        });

        await context.service.getBalance();
        expect(getApiClient).toHaveBeenCalledWith(Network.testnet());
    });
});
