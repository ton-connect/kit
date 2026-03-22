/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Mock } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { StreamingManager } from './StreamingManager';
import type { StreamingWatchType } from './StreamingManager';
import type { Network } from '../api/models';
import type { StreamingProvider } from './StreamingProvider';
import type { WalletKitEventEmitter } from '../types/emitter';
import type { StreamingProviderFactory } from './types';

// ─── Helpers ────────────────────────────────────────────────────────────────

// Real TON addresses in raw format
const ADDR_A = '0:83dfd552e63729b472fcbcc8c44e6cc6691702558b68ecb527e1ba403a0f31a8';
const ADDR_B = '0:ef4458951c1468a43d5506def6543b009c1fd48392497b45453287efdfa40f05';

function makeMockNetwork(chainId = 1): Network {
    return { chainId } as unknown as Network;
}

interface MockProvider extends StreamingProvider {
    watchBalance: Mock<(address: string) => void>;
    unwatchBalance: Mock<(address: string) => void>;
    watchTransactions: Mock<(address: string) => void>;
    unwatchTransactions: Mock<(address: string) => void>;
    watchJettons: Mock<(address: string) => void>;
    unwatchJettons: Mock<(address: string) => void>;
    close: Mock<() => void>;
}

function makeMockProvider(): MockProvider {
    return {
        watchBalance: vi.fn<(address: string) => void>(),
        unwatchBalance: vi.fn<(address: string) => void>(),
        watchTransactions: vi.fn<(address: string) => void>(),
        unwatchTransactions: vi.fn<(address: string) => void>(),
        watchJettons: vi.fn<(address: string) => void>(),
        unwatchJettons: vi.fn<(address: string) => void>(),
        close: vi.fn<() => void>(),
    } as unknown as MockProvider;
}

function makeMockEventEmitter(): WalletKitEventEmitter {
    return {
        on: vi.fn(() => vi.fn()),
        emit: vi.fn(),
        off: vi.fn(),
    } as unknown as WalletKitEventEmitter;
}

function makeManager(network: Network, provider: MockProvider) {
    const emitter = makeMockEventEmitter();
    const factory: StreamingProviderFactory = vi.fn(() => provider);
    const manager = new StreamingManager(emitter);
    manager.registerProviderFactory(network, factory);
    return { manager, emitter, factory: factory as unknown as Mock<StreamingProviderFactory> };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StreamingManager subscriptions', () => {
    const network = makeMockNetwork();
    let provider: MockProvider;

    beforeEach(() => {
        provider = makeMockProvider();
    });

    describe('watchBalance', () => {
        it('calls provider.watchBalance on first watch', () => {
            const { manager } = makeManager(network, provider);
            manager.watchBalance(network, ADDR_A, vi.fn());
            expect(provider.watchBalance).toHaveBeenCalledTimes(1);
        });

        it('does NOT call provider.watchBalance again for the same address', () => {
            const { manager } = makeManager(network, provider);
            manager.watchBalance(network, ADDR_A, vi.fn());
            manager.watchBalance(network, ADDR_A, vi.fn());
            expect(provider.watchBalance).toHaveBeenCalledTimes(1);
        });

        it('calls provider.watchBalance again for a different address', () => {
            const { manager } = makeManager(network, provider);
            manager.watchBalance(network, ADDR_A, vi.fn());
            manager.watchBalance(network, ADDR_B, vi.fn());
            expect(provider.watchBalance).toHaveBeenCalledTimes(2);
        });
    });

    describe('unwatch ref counting', () => {
        it('does NOT call unwatchBalance while there is still another watcher', () => {
            const { manager } = makeManager(network, provider);
            const unwatch1 = manager.watchBalance(network, ADDR_A, vi.fn());
            manager.watchBalance(network, ADDR_A, vi.fn()); // second watcher, same address

            unwatch1(); // first unwatch – count goes from 2 → 1, should NOT unwatch provider
            expect(provider.unwatchBalance).not.toHaveBeenCalled();
        });

        it('calls provider.unwatchBalance when the last watcher unsubscribes', () => {
            const { manager } = makeManager(network, provider);
            const unwatch1 = manager.watchBalance(network, ADDR_A, vi.fn());
            const unwatch2 = manager.watchBalance(network, ADDR_A, vi.fn());

            unwatch1();
            unwatch2(); // count goes from 1 → 0, should call provider
            expect(provider.unwatchBalance).toHaveBeenCalledTimes(1);
        });

        it('can rewatch after full unwatch', () => {
            const { manager } = makeManager(network, provider);
            const unwatch = manager.watchBalance(network, ADDR_A, vi.fn());
            unwatch();

            manager.watchBalance(network, ADDR_A, vi.fn());
            expect(provider.watchBalance).toHaveBeenCalledTimes(2);
        });
    });

    describe('multiple types, same address', () => {
        it('tracks types independently', () => {
            const { manager } = makeManager(network, provider);
            const unwatchBal = manager.watchBalance(network, ADDR_A, vi.fn());
            manager.watchTransactions(network, ADDR_A, vi.fn());

            unwatchBal(); // balance removed, transactions still active
            expect(provider.unwatchBalance).toHaveBeenCalledTimes(1);
            expect(provider.unwatchTransactions).not.toHaveBeenCalled();
        });
    });

    describe('multiple addresses, same type', () => {
        it('unwatching one address does not affect another', () => {
            const { manager } = makeManager(network, provider);
            const unwatchA = manager.watchBalance(network, ADDR_A, vi.fn());
            manager.watchBalance(network, ADDR_B, vi.fn());

            unwatchA();
            expect(provider.unwatchBalance).toHaveBeenCalledTimes(1);
            expect(provider.watchBalance).toHaveBeenCalledTimes(2);
        });
    });

    describe('getWatchers (via getWatchers callback)', () => {
        it('returns correct types and addresses after multiple watches', () => {
            const emitter = makeMockEventEmitter();
            let capturedGetSubs: (() => Map<StreamingWatchType, Set<string>>) | undefined;

            const factory: StreamingProviderFactory = vi.fn(({ getWatchers }) => {
                capturedGetSubs = getWatchers;
                return provider;
            });

            const manager = new StreamingManager(emitter);
            manager.registerProviderFactory(network, factory);

            manager.watchBalance(network, ADDR_A, vi.fn());
            manager.watchJettons(network, ADDR_B, vi.fn());

            expect(capturedGetSubs).toBeDefined();
            const subs = capturedGetSubs!();

            expect(subs.get('balance')).toEqual(new Set([expect.stringContaining('')]));
            expect(subs.get('balance')?.size).toBe(1);
            expect(subs.get('jettons')?.size).toBe(1);
        });

        it('does not include removed subscriptions', () => {
            const emitter = makeMockEventEmitter();
            let capturedGetSubs: (() => Map<StreamingWatchType, Set<string>>) | undefined;

            const factory: StreamingProviderFactory = vi.fn(({ getWatchers }) => {
                capturedGetSubs = getWatchers;
                return provider;
            });

            const manager = new StreamingManager(emitter);
            manager.registerProviderFactory(network, factory);

            const unwatch = manager.watchBalance(network, ADDR_A, vi.fn());
            manager.watchJettons(network, ADDR_B, vi.fn());
            unwatch(); // remove balance for A

            const subs = capturedGetSubs!();
            expect(subs.has('balance')).toBe(false);
            expect(subs.get('jettons')?.size).toBe(1);
        });
    });

    describe('bulk watch method', () => {
        it('subscribes to all specified types and unsubscribes when returned fn is called', () => {
            const { manager } = makeManager(network, provider);
            const unwatch = manager.watch(network, ADDR_A, ['balance', 'transactions'], vi.fn());

            expect(provider.watchBalance).toHaveBeenCalledTimes(1);
            expect(provider.watchTransactions).toHaveBeenCalledTimes(1);

            unwatch();

            expect(provider.unwatchBalance).toHaveBeenCalledTimes(1);
            expect(provider.unwatchTransactions).toHaveBeenCalledTimes(1);
        });
    });

    describe('shutdown', () => {
        it('closes the provider', () => {
            const { manager } = makeManager(network, provider);
            manager.watchBalance(network, ADDR_A, vi.fn());
            manager.shutdown();
            expect(provider.close).toHaveBeenCalledTimes(1);
        });
    });
});
