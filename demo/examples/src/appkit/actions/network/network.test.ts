/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppKit } from '@ton/appkit';
import { Network } from '@ton/walletkit';
import type { WalletInterface } from '@ton/appkit';

import { getNetworkExample } from './get-network';
import { getNetworksExample } from './get-networks';
import { watchNetworksExample } from './watch-networks';

describe('Network Actions Examples', () => {
    let appKit: AppKit;
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        appKit = new AppKit({
            networks: {
                [Network.mainnet().chainId]: {},
                [Network.testnet().chainId]: {},
            },
        });
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    const setupMockWallet = (network: 'mainnet' | 'testnet' = 'mainnet') => {
        const mockWallet = {
            getAddress: () => 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            getWalletId: () => 'mock-wallet-id',
            getNetwork: () => network,
        } as unknown as WalletInterface;

        appKit.walletsManager.setWallets([mockWallet]);
        return mockWallet;
    };

    describe('getNetworkExample', () => {
        it('should log current network when wallet is selected', () => {
            setupMockWallet('testnet');

            getNetworkExample(appKit);

            expect(consoleSpy).toHaveBeenCalledWith('Current network:', 'testnet');
        });

        it('should log nothing if no wallet is selected', () => {
            appKit.walletsManager.setWallets([]);

            getNetworkExample(appKit);

            expect(consoleSpy).not.toHaveBeenCalled();
        });
    });

    describe('getNetworksExample', () => {
        it('should log all configured networks', () => {
            getNetworksExample(appKit);

            expect(consoleSpy).toHaveBeenCalledWith('Configured networks:', [
                expect.objectContaining({ chainId: Network.mainnet().chainId }),
                expect.objectContaining({ chainId: Network.testnet().chainId }),
            ]);
        });
    });

    describe('watchNetworksExample', () => {
        it('should call onChange and log when networks update', () => {
            const unsubscribe = watchNetworksExample(appKit);

            // Trigger a network change by emitting the event
            // @ts-expect-error - internal access
            appKit.networkManager.emitter.emit('networks:updated', {}, 'test');

            expect(consoleSpy).toHaveBeenCalledWith('Networks updated:', [
                expect.objectContaining({ chainId: Network.mainnet().chainId }),
                expect.objectContaining({ chainId: Network.testnet().chainId }),
            ]);
            expect(typeof unsubscribe).toBe('function');

            unsubscribe();
        });
    });
});
