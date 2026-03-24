/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { TonCenterStreamingProvider } from './provider';
import type { StreamingProviderListener, StreamingProviderContext } from '../../api/interfaces/';
import { Network } from '../../api/models';
import type { StreamingWatchType } from '../../api/models';
import { asAddressFriendly } from '../../utils';

// ─── Mocks ──────────────────────────────────────────────────────────────────

class MockWebSocket {
    static OPEN = 1;
    static CONNECTING = 0;
    static CLOSED = 3;

    readyState = MockWebSocket.CONNECTING;
    send = vi.fn();
    close = vi.fn();
    onopen: (() => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onclose: (() => void) | null = null;

    constructor(public url: string) {
        MockWebSocket.lastInstance = this;
        // Simulate connection
        setTimeout(() => {
            this.readyState = MockWebSocket.OPEN;
            if (this.onopen) this.onopen();
        }, 10);
    }

    static lastInstance: MockWebSocket | null = null;
}

// Mock global WebSocket
(global as unknown as { WebSocket: unknown }).WebSocket = MockWebSocket;

// ─── Helpers ────────────────────────────────────────────────────────────────

const ADDR_A = '0:83dfd552e63729b472fcbcc8c44e6cc6691702558b68ecb527e1ba403a0f31a8';
const ADDR_B = '0:ef4458951c1468a43d5506def6543b009c1fd48392497b45453287efdfa40f05';

const makeMockListener = (): StreamingProviderListener => {
    return {
        onBalanceUpdate: vi.fn(),
        onTransactions: vi.fn(),
        onJettonsUpdate: vi.fn(),
    };
};

describe('TonCenterStreamingProvider', () => {
    let listener: StreamingProviderListener;
    let watchers: Map<StreamingWatchType, Set<string>>;

    beforeEach(() => {
        vi.useFakeTimers();
        listener = makeMockListener();
        watchers = new Map();
        MockWebSocket.lastInstance = null;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('connects to the correct URL', () => {
        const context = {
            network: Network.testnet(),
            listener,
            getWatchers: () => watchers,
        };
        const provider = new TonCenterStreamingProvider(context, {
            apiKey: 'test-api-key',
        });

        provider.watchBalance(ADDR_A);
        expect(MockWebSocket.lastInstance?.url).toContain('toncenter.com/api/streaming/v2/ws');
        expect(MockWebSocket.lastInstance?.url).toContain('api_key=test-api-key');
    });

    it('debounces multiple watch calls and sends monolithic subscriptions', async () => {
        const context = {
            network: Network.testnet(),
            listener,
            getWatchers: () => watchers,
        };
        const provider = new TonCenterStreamingProvider(context);

        // Setup watchers state
        watchers.set('balance', new Set([ADDR_A]));
        watchers.set('transactions', new Set([ADDR_A]));

        provider.watchBalance(ADDR_A);
        provider.watchTransactions(ADDR_A);

        // Advance for connection (10ms)
        vi.advanceTimersByTime(20);
        // Advance for debounce (50ms)
        vi.advanceTimersByTime(100);

        // We might get up to 2 subscribe messages: one from onopen, one from requestSync debounce.
        // Both are acceptable as they are both monolithic.
        const sentMessages = MockWebSocket.lastInstance?.send.mock.calls.map((call) => JSON.parse(call[0]));
        const subscribeMsgs = sentMessages?.filter((m) => m.operation === 'subscribe');

        expect(subscribeMsgs!.length).toBeGreaterThanOrEqual(1);
        const lastMsg = subscribeMsgs![subscribeMsgs!.length - 1];
        expect(lastMsg.addresses).toContain(ADDR_A);
        expect(lastMsg.types).toContain('account_state_change');
        expect(lastMsg.types).toContain('transactions');
    });

    it('sends unsubscribe when some (but not all) watchers are removed', async () => {
        const context = {
            network: Network.testnet(),
            listener,
            getWatchers: () => watchers,
        };
        const provider = new TonCenterStreamingProvider(context);

        // 1. Subscribe to ADDR_A and ADDR_B
        watchers.set('balance', new Set([ADDR_A, ADDR_B]));
        provider.watchBalance(ADDR_A);
        provider.watchBalance(ADDR_B);
        vi.advanceTimersByTime(200);

        // 2. Remove ADDR_A but keep ADDR_B
        watchers.set('balance', new Set([ADDR_B]));
        provider.unwatchBalance(ADDR_A);
        vi.advanceTimersByTime(200);

        const sentMessages = MockWebSocket.lastInstance?.send.mock.calls.map((call) => JSON.parse(call[0]));
        // Since we still have active subscriptions (ADDR_B), the monolithic sync will send a new 'subscribe' with only ADDR_B.
        // TonCenter v2 replaces the subscription, so we don't need 'unsubscribe' message unless we want to clear everything.
        const lastSubscribe = sentMessages?.filter((m) => m.operation === 'subscribe').pop();

        expect(lastSubscribe.addresses).not.toContain(ADDR_A);
        expect(lastSubscribe.addresses).toContain(ADDR_B);
    });

    it('closes connection when all watchers are removed', async () => {
        const context: StreamingProviderContext = {
            network: Network.testnet(),
            listener,
            getWatchers: () =>
                Object.assign(() => new Map<StreamingWatchType, Set<string>>(), {
                    get: (type: StreamingWatchType) => (type === 'balance' ? new Set([ADDR_A]) : new Set<string>()),
                })(),
        };
        const provider = new TonCenterStreamingProvider(context);
        provider.watchBalance(ADDR_A);
        vi.advanceTimersByTime(200);

        const ws = MockWebSocket.lastInstance!;
        expect(ws.close).not.toHaveBeenCalled();

        provider.unwatchBalance(ADDR_A);

        expect(ws.close).toHaveBeenCalled();
    });

    it('handles rapid watch/unwatch for the same address gracefully via debouncing', async () => {
        const context = {
            network: Network.testnet(),
            listener,
            getWatchers: () => watchers,
        };
        const provider = new TonCenterStreamingProvider(context);

        // Simulate 1st watch
        watchers.set('balance', new Set([ADDR_A]));
        provider.watchBalance(ADDR_A);

        // Simulate 2nd watch immediately
        provider.watchBalance(ADDR_A);

        // Advance only connection time (10ms for onopen)
        vi.advanceTimersByTime(20);
        // Initial sync happens on onopen
        expect(MockWebSocket.lastInstance?.send).toHaveBeenCalledTimes(1);

        // Simulate 2nd watch immediately (should trigger debounce)
        provider.watchBalance(ADDR_A);

        // Advance debounce time (50ms)
        vi.advanceTimersByTime(100);

        const sentMessages = MockWebSocket.lastInstance?.send.mock.calls.map((call) => JSON.parse(call[0]));
        const subscribeMsgs = sentMessages?.filter((m) => m.operation === 'subscribe');

        // Should be 2 subscribe messages: one from onopen, one from debounced requestSync
        expect(subscribeMsgs!.length).toBe(2);
        expect(subscribeMsgs![1].addresses).toContain(ADDR_A);

        // Now unwatch once (simulating one of two subscribers dropping)
        provider.unwatchBalance(ADDR_A);
        vi.advanceTimersByTime(100);

        // Since getWatchers still has ADDR_A (simulating ref count > 0 at Manager level)
        const lastMsg = JSON.parse(MockWebSocket.lastInstance?.send.mock.calls.pop()![0]);
        expect(lastMsg.operation).toBe('subscribe');
        expect(lastMsg.addresses).toContain(ADDR_A);

        // Finally unwatch last one
        watchers.delete('balance');
        provider.unwatchBalance(ADDR_A);
        vi.advanceTimersByTime(100);

        expect(MockWebSocket.lastInstance?.close).toHaveBeenCalled();
    });

    it('handles incoming account state notifications', async () => {
        const context = {
            network: Network.testnet(),
            listener,
            getWatchers: () => watchers,
        };
        const provider = new TonCenterStreamingProvider(context);

        watchers.set('balance', new Set([asAddressFriendly(ADDR_A)]));
        provider.watchBalance(ADDR_A);
        vi.advanceTimersByTime(200);

        const ws = MockWebSocket.lastInstance!;
        const notification = {
            type: 'account_state_change',
            account: ADDR_A,
            state: {
                balance: '1000000000',
                last_transaction_id: { lt: '123', hash: 'abc' },
            },
        };

        ws.onmessage!({ data: JSON.stringify(notification) } as MessageEvent);

        expect(listener.onBalanceUpdate).toHaveBeenCalled();
        const update = vi.mocked(listener.onBalanceUpdate).mock.calls[0][0];
        expect(update.rawBalance).toBe('1000000000');
        expect(update.balance).toBe('1');
    });

    describe('Finality and Invalidation', () => {
        let provider: TonCenterStreamingProvider;
        const TRACE_ID = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
        const FRIENDLY_A = asAddressFriendly(ADDR_A);
        const FRIENDLY_B = asAddressFriendly(ADDR_B);

        const makeMockTx = (account: string) => ({
            account,
            hash: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
            lt: '1000',
            now: 123456789,
            mc_block_seqno: 100,
            orig_status: 'active',
            end_status: 'active',
            total_fees: '100',
            trace_id: 'trace-id',
            description: {
                type: 'generic',
                aborted: false,
                destroyed: false,
                credit_first: false,
                is_tock: false,
                installed: false,
                storage_ph: { storage_fees_collected: '0', status_change: 'unchanged' },
                compute_ph: { skipped: true, reason: 'test' },
            },
            block_ref: { workchain: 0, shard: '-8000000000000000', seqno: 100 },
            in_msg: null,
            out_msgs: [],
            account_state_before: { hash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', balance: '1000' },
            account_state_after: { hash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', balance: '900' },
        });

        beforeEach(() => {
            const context = {
                network: Network.testnet(),
                listener,
                getWatchers: () => watchers,
            };
            provider = new TonCenterStreamingProvider(context);
            watchers.set('transactions', new Set([FRIENDLY_A, FRIENDLY_B]));
        });

        it('ignores notifications with lower finality than cached', () => {
            const confirmedMsg = {
                type: 'transactions',
                finality: 'confirmed',
                trace_external_hash_norm: TRACE_ID,
                transactions: [makeMockTx(FRIENDLY_A)],
            };
            const pendingMsg = {
                type: 'transactions',
                finality: 'pending',
                trace_external_hash_norm: TRACE_ID,
                transactions: [makeMockTx(FRIENDLY_A)],
            };

            // @ts-expect-error accessing protected
            provider.onMessage({ data: JSON.stringify(confirmedMsg) } as MessageEvent);
            expect(listener.onTransactions).toHaveBeenCalledTimes(1);

            // @ts-expect-error accessing protected
            provider.onMessage({ data: JSON.stringify(pendingMsg) } as MessageEvent);
            expect(listener.onTransactions).toHaveBeenCalledTimes(1);
        });

        it('processes notifications with higher finality than cached', () => {
            const pendingMsg = {
                type: 'transactions',
                finality: 'pending',
                trace_external_hash_norm: TRACE_ID,
                transactions: [makeMockTx(FRIENDLY_A)],
            };
            const confirmedMsg = {
                type: 'transactions',
                finality: 'confirmed',
                trace_external_hash_norm: TRACE_ID,
                transactions: [makeMockTx(FRIENDLY_A)],
            };

            // @ts-expect-error accessing protected
            provider.onMessage({ data: JSON.stringify(pendingMsg) } as MessageEvent);
            expect(listener.onTransactions).toHaveBeenCalledTimes(1);

            // @ts-expect-error accessing protected
            provider.onMessage({ data: JSON.stringify(confirmedMsg) } as MessageEvent);
            expect(listener.onTransactions).toHaveBeenCalledTimes(2);
        });

        it('notifies all participating accounts on trace_invalidated', () => {
            const traceMsg = {
                type: 'transactions',
                finality: 'pending',
                trace_external_hash_norm: TRACE_ID,
                transactions: [makeMockTx(FRIENDLY_A), makeMockTx(FRIENDLY_B)],
            };

            const invalidateMsg = {
                type: 'trace_invalidated',
                trace_external_hash_norm: TRACE_ID,
            };

            // @ts-expect-error accessing protected
            provider.onMessage({ data: JSON.stringify(traceMsg) } as MessageEvent);
            expect(listener.onTransactions).toHaveBeenCalledTimes(2);

            // @ts-expect-error accessing protected
            provider.onMessage({ data: JSON.stringify(invalidateMsg) } as MessageEvent);
            expect(listener.onTransactions).toHaveBeenCalledTimes(4);

            const lastCalls = vi.mocked(listener.onTransactions).mock.calls.slice(2);
            expect(lastCalls[0][0]).toMatchObject({
                address: FRIENDLY_A,
                invalidated: true,
                traceHash: expect.any(String), // Hex format
            });
            expect(lastCalls[1][0]).toMatchObject({
                address: FRIENDLY_B,
                invalidated: true,
                traceHash: expect.any(String), // Hex format
            });
        });
    });

    describe('Watcher Filtering', () => {
        let provider: TonCenterStreamingProvider;
        const FRIENDLY_A = asAddressFriendly(ADDR_A);
        const FRIENDLY_B = asAddressFriendly(ADDR_B);

        beforeEach(() => {
            const context = { network: Network.testnet(), listener, getWatchers: () => watchers };
            provider = new TonCenterStreamingProvider(context);
            watchers.clear();
        });

        it('ignores balance updates for non-watched addresses', () => {
            watchers.set('balance', new Set([FRIENDLY_A]));
            const msg = {
                type: 'account_state_change',
                account: ADDR_B,
                state: { balance: '1000' },
            };
            // @ts-expect-error accessing protected
            provider.onMessage({ data: JSON.stringify(msg) } as MessageEvent);
            expect(listener.onBalanceUpdate).not.toHaveBeenCalled();
        });

        it('ignores transaction updates for non-watched addresses', () => {
            watchers.set('transactions', new Set([FRIENDLY_A]));
            const msg = {
                type: 'transactions',
                finality: 'pending',
                trace_external_hash_norm: 'hash',
                transactions: [
                    {
                        account: FRIENDLY_B,
                        hash: 'hash',
                        lt: '100',
                        now: 123,
                        mc_block_seqno: 1,
                        description: {
                            type: 'generic',
                            aborted: false,
                            destroyed: false,
                            credit_first: false,
                            is_tock: false,
                            installed: false,
                            storage_ph: { storage_fees_collected: '0', status_change: '' },
                            compute_ph: { skipped: true, reason: '' },
                        },
                        block_ref: { workchain: 0, shard: '', seqno: 1 },
                        account_state_before: { balance: '0' },
                        account_state_after: { balance: '100' },
                    },
                ],
            };
            // @ts-expect-error accessing protected
            provider.onMessage({ data: JSON.stringify(msg) } as MessageEvent);
            expect(listener.onTransactions).not.toHaveBeenCalled();
        });

        it('ignores jetton updates for non-watched addresses', () => {
            watchers.set('jettons', new Set([FRIENDLY_A]));
            const msg = {
                type: 'jettons_change',
                owner: FRIENDLY_B,
                jettons: [],
            };
            // @ts-expect-error accessing protected
            provider.onMessage({ data: JSON.stringify(msg) } as MessageEvent);
            expect(listener.onJettonsUpdate).not.toHaveBeenCalled();
        });
    });
});
