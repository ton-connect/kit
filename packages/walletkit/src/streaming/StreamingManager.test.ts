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

// ─── Helpers ────────────────────────────────────────────────────────────────

// Real TON addresses in raw format
const ADDR_A = '0:83dfd552e63729b472fcbcc8c44e6cc6691702558b68ecb527e1ba403a0f31a8';
const ADDR_B = '0:ef4458951c1468a43d5506def6543b009c1fd48392497b45453287efdfa40f05';

const makeMockNetwork = (chainId = 1): Network => {
    return { chainId } as unknown as Network;
};

interface MockProvider extends StreamingProvider {
    watchBalance: Mock<(address: string, onChange: (update: BalanceUpdate) => void) => () => void>;
    watchTransactions: Mock;
    watchJettons: Mock;
    disconnect: Mock<() => void>;
    connect: Mock<() => void>;
    onConnectionChange: Mock<(callback: (connected: boolean) => void) => () => void>;
    _unsubBalance: Mock<() => void>;
    _unsubTransactions: Mock<() => void>;
    _unsubJettons: Mock<() => void>;
}

const makeMockProvider = (network: Network = makeMockNetwork()): MockProvider => {
    const _unsubBalance = vi.fn<() => void>();
    const _unsubTransactions = vi.fn<() => void>();
    const _unsubJettons = vi.fn<() => void>();
    return {
        type: 'streaming' as const,
        providerId: 'mock',
        network,
        watchBalance: vi.fn(() => _unsubBalance),
        watchTransactions: vi.fn(() => _unsubTransactions),
        watchJettons: vi.fn(() => _unsubJettons),
        disconnect: vi.fn<() => void>(),
        connect: vi.fn<() => void>(),
        onConnectionChange: vi.fn(() => vi.fn()),
        _unsubBalance,
        _unsubTransactions,
        _unsubJettons,
    } as unknown as MockProvider;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeFactoryCtx = () => vi.fn(() => ({ networkManager: {} as any, eventEmitter: {} as any }))();

const makeManager = (provider: MockProvider) => {
    const factory: StreamingProviderFactory = vi.fn(() => provider);
    const manager = new StreamingManager(() => makeFactoryCtx());
    manager.registerProvider(factory);
    return { manager, factory: factory as unknown as Mock<StreamingProviderFactory> };
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StreamingManager subscriptions', () => {
    const network = makeMockNetwork();
    let provider: MockProvider;

    beforeEach(() => {
        provider = makeMockProvider(network);
    });

    describe('hasProvider', () => {
        it('returns false before registration', () => {
            const manager = new StreamingManager(() => makeFactoryCtx());
            expect(manager.hasProvider(network)).toBe(false);
        });

        it('returns true after registration', () => {
            const { manager } = makeManager(provider);
            expect(manager.hasProvider(network)).toBe(true);
        });
    });

    describe('error handling', () => {
        it('throws when watching without a registered provider', () => {
            const manager = new StreamingManager(() => makeFactoryCtx());
            expect(() => manager.watchBalance(network, ADDR_A, vi.fn())).toThrow();
        });
    });

    describe('watch methods', () => {
        it('calls provider.watchBalance', () => {
            const { manager } = makeManager(provider);
            manager.watchBalance(network, ADDR_A, vi.fn());
            expect(provider.watchBalance).toHaveBeenCalledTimes(1);
        });

        it('calls provider.watchBalance for each consumer', () => {
            const { manager } = makeManager(provider);
            manager.watchBalance(network, ADDR_A, vi.fn());
            manager.watchBalance(network, ADDR_A, vi.fn());
            expect(provider.watchBalance).toHaveBeenCalledTimes(2);
        });

        it('calls provider.watchBalance for different addresses', () => {
            const { manager } = makeManager(provider);
            manager.watchBalance(network, ADDR_A, vi.fn());
            manager.watchBalance(network, ADDR_B, vi.fn());
            expect(provider.watchBalance).toHaveBeenCalledTimes(2);
        });

        it('calls provider.watchTransactions', () => {
            const { manager } = makeManager(provider);
            manager.watchTransactions(network, ADDR_A, vi.fn());
            expect(provider.watchTransactions).toHaveBeenCalledTimes(1);
        });

        it('calls provider.watchJettons', () => {
            const { manager } = makeManager(provider);
            manager.watchJettons(network, ADDR_A, vi.fn());
            expect(provider.watchJettons).toHaveBeenCalledTimes(1);
        });

        it('passes onChange callback directly to provider', () => {
            const { manager } = makeManager(provider);
            const cb = vi.fn();
            manager.watchBalance(network, ADDR_A, cb);
            const [, passedCb] = vi.mocked(provider.watchBalance).mock.calls[0];
            expect(passedCb).toBe(cb);
        });
    });

    describe('unwatch', () => {
        it('calls the provider unsubscribe fn when manager unwatch is called', () => {
            const { manager } = makeManager(provider);
            const unwatch = manager.watchBalance(network, ADDR_A, vi.fn());
            unwatch();
            expect(provider._unsubBalance).toHaveBeenCalledTimes(1);
        });

        it('calls provider unsubscribe for each consumer independently', () => {
            const { manager } = makeManager(provider);
            const unwatch1 = manager.watchBalance(network, ADDR_A, vi.fn());
            const unwatch2 = manager.watchBalance(network, ADDR_A, vi.fn());

            unwatch1();
            expect(provider._unsubBalance).toHaveBeenCalledTimes(1);

            unwatch2();
            expect(provider._unsubBalance).toHaveBeenCalledTimes(2);
        });

        it('unwatch for one type does not affect another', () => {
            const { manager } = makeManager(provider);
            const unwatchBal = manager.watchBalance(network, ADDR_A, vi.fn());
            manager.watchTransactions(network, ADDR_A, vi.fn());

            unwatchBal();
            expect(provider._unsubBalance).toHaveBeenCalledTimes(1);
            expect(provider._unsubTransactions).not.toHaveBeenCalled();
        });
    });

    describe('bulk watch method', () => {
        it('subscribes to all specified types and unsubscribes when returned fn is called', () => {
            const { manager } = makeManager(provider);
            const unwatch = manager.watch(network, ADDR_A, ['balance', 'transactions'], vi.fn());

            expect(provider.watchBalance).toHaveBeenCalledTimes(1);
            expect(provider.watchTransactions).toHaveBeenCalledTimes(1);

            unwatch();

            expect(provider._unsubBalance).toHaveBeenCalledTimes(1);
            expect(provider._unsubTransactions).toHaveBeenCalledTimes(1);
        });
    });

    describe('disconnect', () => {
        it('calls disconnect() on all registered providers', () => {
            const { manager } = makeManager(provider);
            manager.disconnect();
            expect(provider.disconnect).toHaveBeenCalledTimes(1);
        });

        it('does not remove providers — same instance is reused after disconnect', () => {
            const { manager, factory } = makeManager(provider);
            manager.watchBalance(network, ADDR_A, vi.fn());
            manager.disconnect();
            manager.watchBalance(network, ADDR_A, vi.fn());
            expect(factory).toHaveBeenCalledTimes(1);
        });
    });

    describe('connect', () => {
        it('calls connect() on all registered providers', () => {
            const { manager } = makeManager(provider);
            manager.connect();
            expect(provider.connect).toHaveBeenCalledTimes(1);
        });

        it('reconnects after disconnect', () => {
            const { manager } = makeManager(provider);
            manager.watchBalance(network, ADDR_A, vi.fn());
            manager.disconnect();
            manager.connect();
            expect(provider.disconnect).toHaveBeenCalledTimes(1);
            expect(provider.connect).toHaveBeenCalledTimes(1);
        });
    });

    describe('multiple networks', () => {
        it('uses separate providers for different chainIds', () => {
            const network1 = makeMockNetwork(1);
            const network2 = makeMockNetwork(2);
            const provider1 = makeMockProvider(network1);
            const provider2 = makeMockProvider(network2);
            const manager = new StreamingManager(() => makeFactoryCtx());

            manager.registerProvider(() => provider1);
            manager.registerProvider(() => provider2);

            manager.watchBalance(network1, ADDR_A, vi.fn());
            manager.watchBalance(network2, ADDR_A, vi.fn());

            expect(provider1.watchBalance).toHaveBeenCalledTimes(1);
            expect(provider2.watchBalance).toHaveBeenCalledTimes(1);
        });
    });
});
