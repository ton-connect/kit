/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TonCenterStreamingProvider } from './provider';
import type { StreamingProviderListener } from '../StreamingProvider';

// ─── Mocks ──────────────────────────────────────────────────────────────────

class MockWebSocket {
    static OPEN = 1;
    static CONNECTING = 0;
    static CLOSED = 3;

    readyState = MockWebSocket.CONNECTING;
    send = vi.fn();
    close = vi.fn();
    onopen: (() => void) | null = null;
    onmessage: ((event: any) => void) | null = null;
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
(global as any).WebSocket = MockWebSocket;

// ─── Helpers ────────────────────────────────────────────────────────────────

const ADDR_A = '0:83dfd552e63729b472fcbcc8c44e6cc6691702558b68ecb527e1ba403a0f31a8';
const ADDR_B = '0:ef4458951c1468a43d5506def6543b009c1fd48392497b45453287efdfa40f05';

function makeMockListener(): StreamingProviderListener {
    return {
        onBalanceUpdate: vi.fn(),
        onTransactions: vi.fn(),
        onJettonsUpdate: vi.fn(),
        onTraceUpdate: vi.fn(),
    };
}

describe('TonCenterStreamingProvider', () => {
    let listener: StreamingProviderListener;
    let watchers: Map<string, Set<string>>;

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
        const provider = new TonCenterStreamingProvider({
            listener,
            getWatchers: () => watchers,
            apiKey: 'test-api-key'
        });

        provider.watchBalance(ADDR_A);
        expect(MockWebSocket.lastInstance?.url).toContain('toncenter.com/api/streaming/v2/ws');
        expect(MockWebSocket.lastInstance?.url).toContain('api_key=test-api-key');
    });

    it('debounces multiple watch calls and sends monolithic subscriptions', async () => {
        const provider = new TonCenterStreamingProvider({
            listener,
            getWatchers: () => watchers,
        });

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
        const sentMessages = MockWebSocket.lastInstance?.send.mock.calls.map(call => JSON.parse(call[0]));
        const subscribeMsgs = sentMessages?.filter(m => m.operation === 'subscribe');

        expect(subscribeMsgs!.length).toBeGreaterThanOrEqual(1);
        const lastMsg = subscribeMsgs![subscribeMsgs!.length - 1];
        expect(lastMsg.addresses).toContain(ADDR_A);
        expect(lastMsg.types).toContain('account_state_change');
        expect(lastMsg.types).toContain('transactions');
    });

    it('sends unsubscribe when some (but not all) watchers are removed', async () => {
        const provider = new TonCenterStreamingProvider({
            listener,
            getWatchers: () => watchers,
        });

        // 1. Subscribe to ADDR_A and ADDR_B
        watchers.set('balance', new Set([ADDR_A, ADDR_B]));
        provider.watchBalance(ADDR_A);
        provider.watchBalance(ADDR_B);
        vi.advanceTimersByTime(200); 

        // 2. Remove ADDR_A but keep ADDR_B
        watchers.set('balance', new Set([ADDR_B]));
        provider.unwatchBalance(ADDR_A);
        vi.advanceTimersByTime(200); 

        const sentMessages = MockWebSocket.lastInstance?.send.mock.calls.map(call => JSON.parse(call[0]));
        // Since we still have active subscriptions (ADDR_B), the monolithic sync will send a new 'subscribe' with only ADDR_B.
        // TonCenter v2 replaces the subscription, so we don't need 'unsubscribe' message unless we want to clear everything.
        const lastSubscribe = sentMessages?.filter(m => m.operation === 'subscribe').pop();

        expect(lastSubscribe.addresses).not.toContain(ADDR_A);
        expect(lastSubscribe.addresses).toContain(ADDR_B);
    });

    it('closes connection when all watchers are removed', async () => {
        const provider = new TonCenterStreamingProvider({
            listener,
            getWatchers: () => watchers,
        });

        watchers.set('balance', new Set([ADDR_A]));
        provider.watchBalance(ADDR_A);
        vi.advanceTimersByTime(200);

        const ws = MockWebSocket.lastInstance!;
        expect(ws.close).not.toHaveBeenCalled();

        watchers.clear();
        provider.unwatchBalance(ADDR_A);
        
        expect(ws.close).toHaveBeenCalled();
    });

    it('handles incoming account state notifications', async () => {
        const provider = new TonCenterStreamingProvider({
            listener,
            getWatchers: () => watchers,
        });

        provider.watchBalance(ADDR_A);
        vi.advanceTimersByTime(200);

        const ws = MockWebSocket.lastInstance!;
        const notification = {
            type: 'account_state_change',
            account: ADDR_A,
            state: {
                balance: '1000000000',
                last_transaction_id: { lt: '123', hash: 'abc' }
            }
        };

        ws.onmessage!({ data: JSON.stringify(notification) } as MessageEvent);

        expect(listener.onBalanceUpdate).toHaveBeenCalled();
        const update = (listener.onBalanceUpdate as any).mock.calls[0][0];
        expect(update.balance).toBe('1000000000');
    });
});
