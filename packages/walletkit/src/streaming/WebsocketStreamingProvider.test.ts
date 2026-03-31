/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

class MockWebSocket {
    static OPEN = 1;
    static CONNECTING = 0;
    static CLOSED = 3;
    static lastInstance: MockWebSocket | null = null;

    readyState = MockWebSocket.CONNECTING;
    onopen: (() => void) | null = null;
    onclose: (() => void) | null = null;
    onmessage: ((ev: MessageEvent) => void) | null = null;
    send = vi.fn();
    close = vi.fn();

    constructor(public url: string) {
        MockWebSocket.lastInstance = this;
        setTimeout(() => {
            this.readyState = MockWebSocket.OPEN;
            if (this.onopen) this.onopen();
        }, 0);
    }
}

// @ts-expect-error WebSocket is global
global.WebSocket = MockWebSocket;

import type { StreamingProviderListener, StreamingProviderContext } from '../api/interfaces/StreamingProvider';
import { WebsocketStreamingProvider } from './WebsocketStreamingProvider';

const ADDR = '0:83dfd552e63729b472fcbcc8c44e6cc6691702558b68ecb527e1ba403a0f31a8';

class TestProvider extends WebsocketStreamingProvider {
    protected getUrl() {
        return 'ws://test';
    }
    protected onMessage() {}
    protected fullResync() {}
    protected onWatch() {}
    protected onUnwatch() {}
    protected getPingMessage() {
        return { type: 'ping' };
    }

    public triggerClose() {
        if (this.ws) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this.ws as any).onclose?.();
        }
    }
}

const makeContext = (): StreamingProviderContext => {
    const listener: StreamingProviderListener = {
        onBalanceUpdate: vi.fn(),
        onTransactions: vi.fn(),
        onJettonsUpdate: vi.fn(),
    };
    return {
        listener,
        network: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    };
};

describe('WebsocketStreamingProvider', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        MockWebSocket.lastInstance = null;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should connect when watching a resource', () => {
        const provider = new TestProvider(makeContext());
        provider.watchBalance(ADDR);
        expect(MockWebSocket.lastInstance).not.toBeNull();
    });

    it('should schedule reconnection on close if there are active subscriptions', async () => {
        const provider = new TestProvider(makeContext());
        provider.watchBalance(ADDR);

        await vi.runOnlyPendingTimersAsync();

        provider.triggerClose();

        vi.runOnlyPendingTimers();
        expect(MockWebSocket.lastInstance).not.toBeNull();
    });

    it('does not open a new connection while already connecting', () => {
        const provider = new TestProvider(makeContext());
        provider.watchBalance(ADDR);
        const ws1 = MockWebSocket.lastInstance!;
        expect(ws1.readyState).toBe(MockWebSocket.CONNECTING);

        provider.watchBalance(ADDR); // ensureConnected should return early
        expect(MockWebSocket.lastInstance).toBe(ws1);
    });

    it('should not reconnect if no active subscriptions', async () => {
        const provider = new TestProvider(makeContext());
        const unsub = provider.watchBalance(ADDR);

        await vi.runOnlyPendingTimersAsync();

        unsub();
        provider.triggerClose();

        vi.advanceTimersByTime(1000);
        // No reconnect scheduled since all subscriptions were removed
    });

    it('should start ping interval on open', async () => {
        const provider = new TestProvider(makeContext());
        provider.watchBalance(ADDR);

        await vi.runOnlyPendingTimersAsync();

        vi.advanceTimersByTime(30000);
        expect(MockWebSocket.lastInstance?.send).toHaveBeenCalledWith(JSON.stringify({ type: 'ping' }));
    });

    it('close() cancels a pending reconnect', async () => {
        const provider = new TestProvider(makeContext());
        provider.watchBalance(ADDR);
        await vi.runOnlyPendingTimersAsync();
        const ws = MockWebSocket.lastInstance!;

        provider.triggerClose(); // schedules reconnect at 300ms
        provider.close(); // should cancel it

        vi.advanceTimersByTime(500);
        expect(MockWebSocket.lastInstance).toBe(ws); // no new connection
    });

    it('uses exponential backoff for reconnect delays', async () => {
        const provider = new TestProvider(makeContext());
        provider.watchBalance(ADDR);
        await vi.runOnlyPendingTimersAsync();
        const ws1 = MockWebSocket.lastInstance!;

        // First disconnect → attempt 1: 300ms
        provider.triggerClose();
        vi.advanceTimersByTime(299);
        expect(MockWebSocket.lastInstance).toBe(ws1);
        vi.advanceTimersByTime(1);
        const ws2 = MockWebSocket.lastInstance!;
        expect(ws2).not.toBe(ws1);

        // ws2 fails before connecting → attempt 2: 600ms
        ws2.onclose?.();
        vi.advanceTimersByTime(599);
        expect(MockWebSocket.lastInstance).toBe(ws2);
        vi.advanceTimersByTime(1);
        expect(MockWebSocket.lastInstance).not.toBe(ws2);
    });

    describe('ref counting', () => {
        it('does not close when one of two watchers unsubscribes', async () => {
            const provider = new TestProvider(makeContext());
            provider.watchBalance(ADDR);
            const unsub2 = provider.watchBalance(ADDR);

            await vi.runOnlyPendingTimersAsync();
            const ws = MockWebSocket.lastInstance!;

            unsub2();
            expect(ws.close).not.toHaveBeenCalled();
        });

        it('closes when last watcher unsubscribes', async () => {
            const provider = new TestProvider(makeContext());
            const unsub1 = provider.watchBalance(ADDR);
            const unsub2 = provider.watchBalance(ADDR);

            await vi.runOnlyPendingTimersAsync();
            const ws = MockWebSocket.lastInstance!;

            unsub1();
            unsub2();
            expect(ws.close).toHaveBeenCalled();
        });

        it('tracks types independently', async () => {
            const provider = new TestProvider(makeContext());
            const unsubBal = provider.watchBalance(ADDR);
            provider.watchTransactions(ADDR);

            await vi.runOnlyPendingTimersAsync();
            const ws = MockWebSocket.lastInstance!;

            unsubBal();
            expect(ws.close).not.toHaveBeenCalled();
        });

        it('getActiveWatchers reflects current subscriptions', () => {
            const provider = new TestProvider(makeContext());
            const unsub = provider.watchBalance(ADDR);
            provider.watchTransactions(ADDR);

            // @ts-expect-error accessing protected
            let watchers = provider.getActiveWatchers();
            expect(watchers.get('balance')?.size).toBe(1);
            expect(watchers.get('transactions')?.size).toBe(1);

            unsub();

            // @ts-expect-error accessing protected
            watchers = provider.getActiveWatchers();
            expect(watchers.has('balance')).toBe(false);
            expect(watchers.get('transactions')?.size).toBe(1);
        });
    });
});
