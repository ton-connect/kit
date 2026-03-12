/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppKit, NETWORKS_EVENTS } from '@ton/appkit';
import { Network } from '@ton/walletkit';
import type { WalletInterface } from '@ton/appkit';

import { getNetworkExample } from './get-network';
import { getNetworksExample } from './get-networks';
import { watchNetworksExample } from './watch-networks';
import { getBlockNumberExample } from './get-block-number';
import { getDefaultNetworkExample } from './get-default-network';
import { setDefaultNetworkExample } from './set-default-network';
import { watchDefaultNetworkExample } from './watch-default-network';

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

    describe('getBlockNumberExample', () => {
        it('should log the current block number', async () => {
            const mockBlockNumber = 12345678;

            // Mock the API client's getMasterchainInfo
            // @ts-expect-error - internal access
            vi.spyOn(appKit.networkManager, 'getClient').mockReturnValue({
                getMasterchainInfo: vi.fn().mockResolvedValue({ seqno: mockBlockNumber }),
            });
            await getBlockNumberExample(appKit);

            expect(consoleSpy).toHaveBeenCalledWith('Current block number:', mockBlockNumber);
        });
    });

    describe('getDefaultNetworkExample', () => {
        it('should log the current default network', () => {
            // @ts-expect-error - vitest setter/getter types
            vi.spyOn(appKit.networkManager, 'defaultNetwork', 'get').mockReturnValue(Network.testnet() as never);
            getDefaultNetworkExample(appKit);
            expect(consoleSpy).toHaveBeenCalledWith(
                'Default network:',
                expect.objectContaining({ chainId: Network.testnet().chainId }),
            );
        });
    });

    describe('setDefaultNetworkExample', () => {
        it('should set the default network to testnet and then clear it', () => {
            // @ts-expect-error - vitest setter/getter types
            const setSpy = vi.spyOn(appKit.networkManager, 'defaultNetwork', 'set');
            setDefaultNetworkExample(appKit);
            expect(setSpy).toHaveBeenCalledWith(expect.objectContaining({ chainId: Network.testnet().chainId }));
            expect(setSpy).toHaveBeenCalledWith(undefined);
        });
    });

    describe('watchDefaultNetworkExample', () => {
        it('should call onChange and log when default network updates', () => {
            const unsubscribe = watchDefaultNetworkExample(appKit);

            // Set default network to testnet to trigger the event and update the value
            vi.spyOn(appKit.networkManager, 'getDefaultNetwork').mockReturnValue(Network.testnet());
            // @ts-expect-error - test environment
            appKit.emitter.emit(NETWORKS_EVENTS.DEFAULT_CHANGED, undefined, 'test');

            expect(consoleSpy).toHaveBeenCalledWith(
                'Default network changed:',
                expect.objectContaining({ chainId: Network.testnet().chainId }),
            );
            expect(typeof unsubscribe).toBe('function');

            unsubscribe();
        });
    });
});
