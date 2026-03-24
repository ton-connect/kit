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
import type { StreamingProvider, StreamingProviderFactory } from '../api/interfaces';
import type { Network, StreamingWatchType, BalanceUpdate } from '../api/models';
import type { WalletKitEventEmitter } from '../types/emitter';
import type { KitEvent } from '../core/EventEmitter';

// ─── Helpers ────────────────────────────────────────────────────────────────

// Real TON addresses in raw format
const ADDR_A = '0:83dfd552e63729b472fcbcc8c44e6cc6691702558b68ecb527e1ba403a0f31a8';
const ADDR_B = '0:ef4458951c1468a43d5506def6543b009c1fd48392497b45453287efdfa40f05';

const makeMockNetwork = (chainId = 1): Network => {
    return { chainId } as unknown as Network;
};

interface MockProvider extends StreamingProvider {
    watchBalance: Mock<(address: string) => void>;
    unwatchBalance: Mock<(address: string) => void>;
    watchTransactions: Mock<(address: string) => void>;
    unwatchTransactions: Mock<(address: string) => void>;
    watchJettons: Mock<(address: string) => void>;
    unwatchJettons: Mock<(address: string) => void>;
    close: Mock<() => void>;
}

const makeMockProvider = (): MockProvider => {
    return {
        watchBalance: vi.fn<(address: string) => void>(),
        unwatchBalance: vi.fn<(address: string) => void>(),
        watchTransactions: vi.fn<(address: string) => void>(),
        unwatchTransactions: vi.fn<(address: string) => void>(),
        watchJettons: vi.fn<(address: string) => void>(),
        unwatchJettons: vi.fn<(address: string) => void>(),
        close: vi.fn<() => void>(),
    } as unknown as MockProvider;
};

const makeMockEventEmitter = (): WalletKitEventEmitter => {
    return {
        on: vi.fn(() => vi.fn()),
        emit: vi.fn(),
        off: vi.fn(),
    } as unknown as WalletKitEventEmitter;
};

const makeManager = (network: Network, provider: MockProvider) => {
    const emitter = makeMockEventEmitter();
    const factory: StreamingProviderFactory = vi.fn(() => provider);
    const manager = new StreamingManager(emitter);
    manager.registerProvider(network, factory);
    return { manager, emitter, factory: factory as unknown as Mock<StreamingProviderFactory> };
};

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

    describe('multiple subscribers for same resource', () => {
        it('notifies all subscribers and handles partial unwatch', () => {
            const { manager, emitter } = makeManager(network, provider);
            const cb1 = vi.fn();
            const cb2 = vi.fn();

            const unwatch1 = manager.watchBalance(network, ADDR_A, cb1);
            manager.watchBalance(network, ADDR_A, cb2);

            // Simulate update
            const update: BalanceUpdate = {
                address: ADDR_A,
                rawBalance: '100000000000',
                balance: '100',
                type: 'balance',
                status: 'finalized',
            };
            // The emitter.on mock returns a function, but we need to trigger the actual callback.
            expect(emitter.on).toHaveBeenCalledTimes(2);

            const calls = vi.mocked(emitter.on).mock.calls;
            const handler1 = calls[0][1] as (event: KitEvent<BalanceUpdate>) => void;
            const handler2 = calls[1][1] as (event: KitEvent<BalanceUpdate>) => void;

            const event: KitEvent<BalanceUpdate> = {
                payload: update,
                type: 'streaming:balance-update',
                timestamp: Date.now(),
            };

            handler1(event);
            handler2(event);

            expect(cb1).toHaveBeenCalledWith(update);
            expect(cb2).toHaveBeenCalledWith(update);

            // Unwatch first
            unwatch1();
            expect(provider.unwatchBalance).not.toHaveBeenCalled();

            cb1.mockClear();
            cb2.mockClear();

            handler1(event); // This one should be "off" in real life, but we called unwatch1() which calls off()
            handler2(event);

            // Since we mocked 'off' (returned by on), we should check if off was called.
            const off1 = vi.mocked(emitter.on).mock.results[0].value;
            expect(off1).toHaveBeenCalled();
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
            manager.registerProvider(network, factory);

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
            manager.registerProvider(network, factory);

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

    describe('multiple networks', () => {
        it('uses separate providers for different chainIds', () => {
            const network1 = makeMockNetwork(1);
            const network2 = makeMockNetwork(2);
            const provider1 = makeMockProvider();
            const provider2 = makeMockProvider();
            const emitter = makeMockEventEmitter();
            const manager = new StreamingManager(emitter);

            manager.registerProvider(network1, () => provider1);
            manager.registerProvider(network2, () => provider2);

            manager.watchBalance(network1, ADDR_A, vi.fn());
            manager.watchBalance(network2, ADDR_A, vi.fn());

            expect(provider1.watchBalance).toHaveBeenCalledTimes(1);
            expect(provider2.watchBalance).toHaveBeenCalledTimes(1);
        });
    });
});
