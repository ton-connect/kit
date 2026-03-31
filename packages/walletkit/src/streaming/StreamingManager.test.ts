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
import type { Network, BalanceUpdate } from '../api/models';
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
    watchBalance: Mock<(address: string) => () => void>;
    watchTransactions: Mock<(address: string) => () => void>;
    watchJettons: Mock<(address: string) => () => void>;
    close: Mock<() => void>;
    _unsubBalance: Mock<() => void>;
    _unsubTransactions: Mock<() => void>;
    _unsubJettons: Mock<() => void>;
}

const makeMockProvider = (): MockProvider => {
    const _unsubBalance = vi.fn<() => void>();
    const _unsubTransactions = vi.fn<() => void>();
    const _unsubJettons = vi.fn<() => void>();
    return {
        watchBalance: vi.fn<(address: string) => () => void>(() => _unsubBalance),
        watchTransactions: vi.fn<(address: string) => () => void>(() => _unsubTransactions),
        watchJettons: vi.fn<(address: string) => () => void>(() => _unsubJettons),
        close: vi.fn<() => void>(),
        _unsubBalance,
        _unsubTransactions,
        _unsubJettons,
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

    describe('hasProvider', () => {
        it('returns false before registration', () => {
            const manager = new StreamingManager(makeMockEventEmitter());
            expect(manager.hasProvider(network)).toBe(false);
        });

        it('returns true after registration', () => {
            const { manager } = makeManager(network, provider);
            expect(manager.hasProvider(network)).toBe(true);
        });
    });

    describe('error handling', () => {
        it('throws when watching without a registered provider', () => {
            const manager = new StreamingManager(makeMockEventEmitter());
            expect(() => manager.watchBalance(network, ADDR_A, vi.fn())).toThrow();
        });
    });

    describe('watch methods', () => {
        it('calls provider.watchBalance', () => {
            const { manager } = makeManager(network, provider);
            manager.watchBalance(network, ADDR_A, vi.fn());
            expect(provider.watchBalance).toHaveBeenCalledTimes(1);
        });

        it('calls provider.watchBalance for each consumer', () => {
            const { manager } = makeManager(network, provider);
            manager.watchBalance(network, ADDR_A, vi.fn());
            manager.watchBalance(network, ADDR_A, vi.fn());
            expect(provider.watchBalance).toHaveBeenCalledTimes(2);
        });

        it('calls provider.watchBalance for different addresses', () => {
            const { manager } = makeManager(network, provider);
            manager.watchBalance(network, ADDR_A, vi.fn());
            manager.watchBalance(network, ADDR_B, vi.fn());
            expect(provider.watchBalance).toHaveBeenCalledTimes(2);
        });

        it('calls provider.watchTransactions', () => {
            const { manager } = makeManager(network, provider);
            manager.watchTransactions(network, ADDR_A, vi.fn());
            expect(provider.watchTransactions).toHaveBeenCalledTimes(1);
        });

        it('calls provider.watchJettons', () => {
            const { manager } = makeManager(network, provider);
            manager.watchJettons(network, ADDR_A, vi.fn());
            expect(provider.watchJettons).toHaveBeenCalledTimes(1);
        });
    });

    describe('unwatch', () => {
        it('calls the provider unsubscribe fn when manager unwatch is called', () => {
            const { manager } = makeManager(network, provider);
            const unwatch = manager.watchBalance(network, ADDR_A, vi.fn());
            unwatch();
            expect(provider._unsubBalance).toHaveBeenCalledTimes(1);
        });

        it('calls provider unsubscribe for each consumer independently', () => {
            const { manager } = makeManager(network, provider);
            const unwatch1 = manager.watchBalance(network, ADDR_A, vi.fn());
            const unwatch2 = manager.watchBalance(network, ADDR_A, vi.fn());

            unwatch1();
            expect(provider._unsubBalance).toHaveBeenCalledTimes(1);

            unwatch2();
            expect(provider._unsubBalance).toHaveBeenCalledTimes(2);
        });

        it('unwatch for one type does not affect another', () => {
            const { manager } = makeManager(network, provider);
            const unwatchBal = manager.watchBalance(network, ADDR_A, vi.fn());
            manager.watchTransactions(network, ADDR_A, vi.fn());

            unwatchBal();
            expect(provider._unsubBalance).toHaveBeenCalledTimes(1);
            expect(provider._unsubTransactions).not.toHaveBeenCalled();
        });
    });

    describe('address filtering', () => {
        it('fires balance callback only for the matching address', () => {
            const { manager, emitter } = makeManager(network, provider);
            const cbA = vi.fn();
            const cbB = vi.fn();

            manager.watchBalance(network, ADDR_A, cbA);
            manager.watchBalance(network, ADDR_B, cbB);

            const calls = vi.mocked(emitter.on).mock.calls;
            const handlerA = calls[0][1] as (event: KitEvent<BalanceUpdate>) => void;
            const handlerB = calls[1][1] as (event: KitEvent<BalanceUpdate>) => void;

            const updateForA: BalanceUpdate = {
                address: ADDR_A,
                rawBalance: '500',
                balance: '0.5',
                type: 'balance',
                status: 'finalized',
            };
            const event: KitEvent<BalanceUpdate> = {
                payload: updateForA,
                type: 'streaming:balance-update',
                timestamp: Date.now(),
            };

            // Both handlers receive the same event (as the real emitter would broadcast)
            handlerA(event);
            handlerB(event); // should NOT call cbB — event is for ADDR_A

            expect(cbA).toHaveBeenCalledWith(updateForA);
            expect(cbB).not.toHaveBeenCalled();
        });
    });

    describe('multiple subscribers for same resource', () => {
        it('notifies all subscribers and unsubscribes EventEmitter listener on unwatch', () => {
            const { manager, emitter } = makeManager(network, provider);
            const cb1 = vi.fn();
            const cb2 = vi.fn();

            const unwatch1 = manager.watchBalance(network, ADDR_A, cb1);
            manager.watchBalance(network, ADDR_A, cb2);

            const update: BalanceUpdate = {
                address: ADDR_A,
                rawBalance: '100000000000',
                balance: '100',
                type: 'balance',
                status: 'finalized',
            };

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

            unwatch1();

            const off1 = vi.mocked(emitter.on).mock.results[0].value;
            expect(off1).toHaveBeenCalled();
        });
    });

    describe('bulk watch method', () => {
        it('subscribes to all specified types and unsubscribes when returned fn is called', () => {
            const { manager } = makeManager(network, provider);
            const unwatch = manager.watch(network, ADDR_A, ['balance', 'transactions'], vi.fn());

            expect(provider.watchBalance).toHaveBeenCalledTimes(1);
            expect(provider.watchTransactions).toHaveBeenCalledTimes(1);

            unwatch();

            expect(provider._unsubBalance).toHaveBeenCalledTimes(1);
            expect(provider._unsubTransactions).toHaveBeenCalledTimes(1);
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
