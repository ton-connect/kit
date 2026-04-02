/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Mock } from 'vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { TonCenterStreamingProvider } from './provider';
import type { ProviderFactoryContext } from '../../types/factory';
import { Network } from '../../api/models';
import { asAddressFriendly } from '../../utils/address';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeContext = (): ProviderFactoryContext => ({ networkManager: {} as any, eventEmitter: {} as any });

describe('TonCenterStreamingProvider', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        MockWebSocket.lastInstance = null;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('connects to testnet URL by default', () => {
        const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });
        provider.watchBalance(ADDR_A, vi.fn());
        expect(MockWebSocket.lastInstance?.url).toContain('testnet.toncenter.com');
    });

    it('connects to mainnet URL when network is mainnet', () => {
        const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.mainnet() });
        provider.watchBalance(ADDR_A, vi.fn());
        expect(MockWebSocket.lastInstance?.url).toContain('toncenter.com');
        expect(MockWebSocket.lastInstance?.url).not.toContain('testnet');
    });

    it('appends api_key to URL when provided', () => {
        const provider = new TonCenterStreamingProvider(makeContext(), {
            network: Network.testnet(),
            apiKey: 'test-api-key',
        });
        provider.watchBalance(ADDR_A, vi.fn());
        expect(MockWebSocket.lastInstance?.url).toContain('toncenter.com/api/streaming/v2/ws');
        expect(MockWebSocket.lastInstance?.url).toContain('api_key=test-api-key');
    });

    it('sends ping in TonCenter protocol format', async () => {
        const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });
        provider.watchBalance(ADDR_A, vi.fn());
        vi.advanceTimersByTime(20); // connect

        const ws = MockWebSocket.lastInstance!;
        vi.advanceTimersByTime(15000); // ping interval

        const pings = ws.send.mock.calls
            .map((call) => JSON.parse(call[0]) as Record<string, unknown>)
            .filter((m) => m.operation === 'ping');

        expect(pings).toHaveLength(1);
        expect(pings[0].id).toMatch(/^ping-/);
    });

    it('ignores pong and subscribed status messages without errors', () => {
        const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });
        const cb = vi.fn();
        provider.watchBalance(ADDR_A, cb);
        vi.advanceTimersByTime(20);

        const ws = MockWebSocket.lastInstance!;

        expect(() => {
            ws.onmessage!({ data: JSON.stringify({ status: 'pong' }) } as MessageEvent);
            ws.onmessage!({ data: JSON.stringify({ status: 'subscribed' }) } as MessageEvent);
        }).not.toThrow();

        expect(cb).not.toHaveBeenCalled();
    });

    it('debounces multiple watch calls and sends monolithic subscriptions', async () => {
        const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });

        provider.watchBalance(ADDR_A, vi.fn());
        provider.watchTransactions(ADDR_A, vi.fn());

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
        expect(lastMsg.addresses).toContain(asAddressFriendly(ADDR_A));
        expect(lastMsg.types).toContain('account_state_change');
        expect(lastMsg.types).toContain('transactions');
    });

    it('sends new subscription without removed address when one watcher is removed', async () => {
        const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });

        const unwatchA = provider.watchBalance(ADDR_A, vi.fn());
        provider.watchBalance(ADDR_B, vi.fn());
        vi.advanceTimersByTime(200);

        unwatchA();
        vi.advanceTimersByTime(200);

        const sentMessages = MockWebSocket.lastInstance?.send.mock.calls.map((call) => JSON.parse(call[0]));
        const lastSubscribe = sentMessages?.filter((m) => m.operation === 'subscribe').pop();

        expect(lastSubscribe.addresses).not.toContain(asAddressFriendly(ADDR_A));
        expect(lastSubscribe.addresses).toContain(asAddressFriendly(ADDR_B));
    });

    it('closes connection when last watcher is removed', async () => {
        const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });
        const unsub = provider.watchBalance(ADDR_A, vi.fn());
        vi.advanceTimersByTime(200);

        const ws = MockWebSocket.lastInstance!;
        expect(ws.close).not.toHaveBeenCalled();

        unsub();

        expect(ws.close).toHaveBeenCalled();
    });

    it('handles rapid watch/unwatch for the same address gracefully via debouncing', async () => {
        const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });

        const unsub1 = provider.watchBalance(ADDR_A, vi.fn());
        const unsub2 = provider.watchBalance(ADDR_A, vi.fn());
        const unsub3 = provider.watchBalance(ADDR_A, vi.fn());

        // Advance for connection
        vi.advanceTimersByTime(20);
        // Initial sync happens on onopen
        expect(MockWebSocket.lastInstance?.send).toHaveBeenCalledTimes(1);

        // Advance debounce
        vi.advanceTimersByTime(100);

        const sentMessages = MockWebSocket.lastInstance?.send.mock.calls.map((call) => JSON.parse(call[0]));
        const subscribeMsgs = sentMessages?.filter((m) => m.operation === 'subscribe');

        expect(subscribeMsgs!.length).toBe(2);
        expect(subscribeMsgs![1].addresses).toContain(asAddressFriendly(ADDR_A));

        // Unwatch one — still 2 left, address stays subscribed
        unsub1();
        vi.advanceTimersByTime(100);

        const lastMsg = JSON.parse(MockWebSocket.lastInstance?.send.mock.calls.pop()![0]);
        expect(lastMsg.operation).toBe('subscribe');
        expect(lastMsg.addresses).toContain(asAddressFriendly(ADDR_A));

        // Unwatch remaining two — connection should close
        unsub2();
        unsub3();
        vi.advanceTimersByTime(100);

        expect(MockWebSocket.lastInstance?.close).toHaveBeenCalled();
    });

    describe('WebSocket subscription protocol', () => {
        const FRIENDLY_A = asAddressFriendly(ADDR_A);
        const FRIENDLY_B = asAddressFriendly(ADDR_B);

        const connect = () => vi.advanceTimersByTime(20);
        const flushDebounce = () => vi.advanceTimersByTime(100);

        const getSubscribeMsgs = (ws: MockWebSocket) =>
            ws.send.mock.calls
                .map((call) => JSON.parse(call[0]) as Record<string, unknown>)
                .filter((m) => m.operation === 'subscribe');

        const getLastSubscribe = (ws: MockWebSocket) => {
            const msgs = getSubscribeMsgs(ws);
            return msgs[msgs.length - 1];
        };

        it('maps balance to account_state_change type', () => {
            const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });
            provider.watchBalance(ADDR_A, vi.fn());
            connect();

            const msg = getLastSubscribe(MockWebSocket.lastInstance!);
            expect(msg.types).toContain('account_state_change');
            expect(msg.types).not.toContain('balance');
        });

        it('maps transactions to transactions type', () => {
            const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });
            provider.watchTransactions(ADDR_A, vi.fn());
            connect();

            const msg = getLastSubscribe(MockWebSocket.lastInstance!);
            expect(msg.types).toContain('transactions');
        });

        it('maps jettons to jettons_change type', () => {
            const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });
            provider.watchJettons(ADDR_A, vi.fn());
            connect();

            const msg = getLastSubscribe(MockWebSocket.lastInstance!);
            expect(msg.types).toContain('jettons_change');
            expect(msg.types).not.toContain('jettons');
        });

        it('includes min_finality and include_metadata in subscribe message', () => {
            const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });
            provider.watchBalance(ADDR_A, vi.fn());
            connect();

            const msg = getLastSubscribe(MockWebSocket.lastInstance!);
            expect(msg.min_finality).toBe('pending');
            expect(msg.include_metadata).toBe(true);
        });

        it('sends a single subscribe message for multiple types on the same address', () => {
            const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });
            provider.watchBalance(ADDR_A, vi.fn());
            provider.watchTransactions(ADDR_A, vi.fn());
            provider.watchJettons(ADDR_A, vi.fn());
            connect();
            flushDebounce();

            const msg = getLastSubscribe(MockWebSocket.lastInstance!);
            expect(msg.addresses).toEqual([FRIENDLY_A]);
            expect((msg.types as string[]).sort()).toEqual(
                ['account_state_change', 'jettons_change', 'transactions'].sort(),
            );
        });

        it('deduplicates addresses when same address is watched for multiple types', () => {
            const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });
            provider.watchBalance(ADDR_A, vi.fn());
            provider.watchTransactions(ADDR_A, vi.fn());
            connect();
            flushDebounce();

            const msg = getLastSubscribe(MockWebSocket.lastInstance!);
            expect(msg.addresses).toEqual([FRIENDLY_A]);
        });

        it('collects all addresses across types into a single list', () => {
            const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });
            provider.watchBalance(ADDR_A, vi.fn());
            provider.watchTransactions(ADDR_B, vi.fn());
            connect();
            flushDebounce();

            const msg = getLastSubscribe(MockWebSocket.lastInstance!);
            expect(msg.addresses).toContain(FRIENDLY_A);
            expect(msg.addresses).toContain(FRIENDLY_B);
        });

        it('removes address from subscribe message after unwatch', () => {
            const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });
            const unwatchA = provider.watchBalance(ADDR_A, vi.fn());
            provider.watchBalance(ADDR_B, vi.fn());
            connect();
            flushDebounce();

            unwatchA();
            flushDebounce();

            const msg = getLastSubscribe(MockWebSocket.lastInstance!);
            expect(msg.addresses).not.toContain(FRIENDLY_A);
            expect(msg.addresses).toContain(FRIENDLY_B);
        });

        it('removes type from subscribe message when last address of that type is removed', () => {
            const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });
            const unwatchBal = provider.watchBalance(ADDR_A, vi.fn());
            provider.watchTransactions(ADDR_B, vi.fn());
            connect();
            flushDebounce();

            unwatchBal();
            flushDebounce();

            const msg = getLastSubscribe(MockWebSocket.lastInstance!);
            expect(msg.types).not.toContain('account_state_change');
            expect(msg.types).toContain('transactions');
            expect(msg.addresses).not.toContain(FRIENDLY_A);
            expect(msg.addresses).toContain(FRIENDLY_B);
        });

        it('keeps type in subscribe message when other addresses still watch it', () => {
            const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });
            const unwatchA = provider.watchBalance(ADDR_A, vi.fn());
            provider.watchBalance(ADDR_B, vi.fn());
            connect();
            flushDebounce();

            unwatchA();
            flushDebounce();

            const msg = getLastSubscribe(MockWebSocket.lastInstance!);
            expect(msg.types).toContain('account_state_change');
        });

        it('restores subscriptions after reconnect', () => {
            const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });
            provider.watchBalance(ADDR_A, vi.fn());
            provider.watchTransactions(ADDR_B, vi.fn());
            connect();

            const firstWs = MockWebSocket.lastInstance!;
            const firstSubscribe = getLastSubscribe(firstWs);
            expect(firstSubscribe.addresses).toContain(FRIENDLY_A);
            expect(firstSubscribe.addresses).toContain(FRIENDLY_B);

            // Simulate disconnect
            firstWs.readyState = MockWebSocket.CLOSED;
            firstWs.onclose?.();

            // Advance past reconnect delay (500ms) + connection time (10ms)
            vi.advanceTimersByTime(600);

            const secondWs = MockWebSocket.lastInstance!;
            expect(secondWs).not.toBe(firstWs);

            const secondSubscribe = getLastSubscribe(secondWs);
            expect(secondSubscribe.addresses).toContain(FRIENDLY_A);
            expect(secondSubscribe.addresses).toContain(FRIENDLY_B);
            expect(secondSubscribe.types).toContain('account_state_change');
            expect(secondSubscribe.types).toContain('transactions');
        });
    });

    it('handles incoming account state notifications', async () => {
        const provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });
        const cb = vi.fn();

        provider.watchBalance(ADDR_A, cb);
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

        expect(cb).toHaveBeenCalled();
        const update = vi.mocked(cb).mock.calls[0][0];
        expect(update.rawBalance).toBe('1000000000');
        expect(update.balance).toBe('1');
    });

    describe('Finality and Invalidation', () => {
        let provider: TonCenterStreamingProvider;
        let txCbA: Mock;
        let txCbB: Mock;
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
            txCbA = vi.fn();
            txCbB = vi.fn();
            provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });
            provider.watchTransactions(ADDR_A, txCbA);
            provider.watchTransactions(ADDR_B, txCbB);
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
            expect(txCbA).toHaveBeenCalledTimes(1);

            // @ts-expect-error accessing protected
            provider.onMessage({ data: JSON.stringify(pendingMsg) } as MessageEvent);
            expect(txCbA).toHaveBeenCalledTimes(1);
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
            expect(txCbA).toHaveBeenCalledTimes(1);

            // @ts-expect-error accessing protected
            provider.onMessage({ data: JSON.stringify(confirmedMsg) } as MessageEvent);
            expect(txCbA).toHaveBeenCalledTimes(2);
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
            expect(txCbA).toHaveBeenCalledTimes(1);
            expect(txCbB).toHaveBeenCalledTimes(1);

            // @ts-expect-error accessing protected
            provider.onMessage({ data: JSON.stringify(invalidateMsg) } as MessageEvent);
            expect(txCbA).toHaveBeenCalledTimes(2);
            expect(txCbB).toHaveBeenCalledTimes(2);

            expect(txCbA.mock.calls[1][0]).toMatchObject({
                address: FRIENDLY_A,
                status: 'invalidated',
                traceHash: expect.any(String),
            });
            expect(txCbB.mock.calls[1][0]).toMatchObject({
                address: FRIENDLY_B,
                status: 'invalidated',
                traceHash: expect.any(String),
            });
        });
    });

    describe('Watcher Filtering', () => {
        let provider: TonCenterStreamingProvider;
        const FRIENDLY_B = asAddressFriendly(ADDR_B);

        beforeEach(() => {
            provider = new TonCenterStreamingProvider(makeContext(), { network: Network.testnet() });
        });

        it('ignores balance updates for non-watched addresses', () => {
            const cb = vi.fn();
            provider.watchBalance(ADDR_A, cb);
            const msg = {
                type: 'account_state_change',
                account: ADDR_B,
                state: { balance: '1000' },
            };
            // @ts-expect-error accessing protected
            provider.onMessage({ data: JSON.stringify(msg) } as MessageEvent);
            expect(cb).not.toHaveBeenCalled();
        });

        it('ignores transaction updates for non-watched addresses', () => {
            const cb = vi.fn();
            provider.watchTransactions(ADDR_A, cb);
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
            expect(cb).not.toHaveBeenCalled();
        });

        it('ignores jetton updates for non-watched addresses', () => {
            const cb = vi.fn();
            provider.watchJettons(ADDR_A, cb);
            const msg = {
                type: 'jettons_change',
                owner: FRIENDLY_B,
                jettons: [],
            };
            // @ts-expect-error accessing protected
            provider.onMessage({ data: JSON.stringify(msg) } as MessageEvent);
            expect(cb).not.toHaveBeenCalled();
        });
    });
});
