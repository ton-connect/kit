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

import { WebsocketStreamingProvider } from './WebsocketStreamingProvider';
import type { BalanceUpdate } from '../api/models';
import { asAddressFriendly } from '../utils/address';

const ADDR = '0:83dfd552e63729b472fcbcc8c44e6cc6691702558b68ecb527e1ba403a0f31a8';

class TestProvider extends WebsocketStreamingProvider {
    readonly providerId = 'test';
    readonly network = { chainId: 1 } as never;

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

    public triggerBalanceUpdate(address: string, update: BalanceUpdate) {
        this.emitBalance(asAddressFriendly(address), update);
    }
}

describe('WebsocketStreamingProvider', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        MockWebSocket.lastInstance = null;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should connect when watching a resource', () => {
        const provider = new TestProvider();
        provider.watchBalance(ADDR, vi.fn());
        expect(MockWebSocket.lastInstance).not.toBeNull();
    });

    it('should schedule reconnection on close if there are active subscriptions', async () => {
        const provider = new TestProvider();
        provider.watchBalance(ADDR, vi.fn());

        await vi.runOnlyPendingTimersAsync();

        provider.triggerClose();

        vi.runOnlyPendingTimers();
        expect(MockWebSocket.lastInstance).not.toBeNull();
    });

    it('does not open a new connection while already connecting', () => {
        const provider = new TestProvider();
        provider.watchBalance(ADDR, vi.fn());
        const ws1 = MockWebSocket.lastInstance!;
        expect(ws1.readyState).toBe(MockWebSocket.CONNECTING);

        provider.watchBalance(ADDR, vi.fn()); // ensureConnected should return early
        expect(MockWebSocket.lastInstance).toBe(ws1);
    });

    it('should not reconnect if no active subscriptions', async () => {
        const provider = new TestProvider();
        const unsub = provider.watchBalance(ADDR, vi.fn());

        await vi.runOnlyPendingTimersAsync();

        unsub();
        provider.triggerClose();

        vi.advanceTimersByTime(1000);
        // No reconnect scheduled since all subscriptions were removed
    });

    it('should start ping interval on open', async () => {
        const provider = new TestProvider();
        provider.watchBalance(ADDR, vi.fn());

        await vi.runOnlyPendingTimersAsync();

        vi.advanceTimersByTime(30000);
        expect(MockWebSocket.lastInstance?.send).toHaveBeenCalledWith(JSON.stringify({ type: 'ping' }));
    });

    it('pings fire continuously, not just once or twice', async () => {
        const provider = new TestProvider();
        provider.watchBalance(ADDR, vi.fn());
        await vi.runOnlyPendingTimersAsync();

        const ws = MockWebSocket.lastInstance!;
        const pingPayload = JSON.stringify({ type: 'ping' });

        // Advance 50 seconds — should fire at 10s, 20s, 30s, 40s, 50s = 5 pings
        vi.advanceTimersByTime(50000);

        const pingCount = ws.send.mock.calls.filter((call) => call[0] === pingPayload).length;
        expect(pingCount).toBe(5);
    });

    it('does not disconnect when resubscribing within checkClose debounce window', async () => {
        const provider = new TestProvider();
        const unsub = provider.watchBalance(ADDR, vi.fn());
        await vi.runOnlyPendingTimersAsync();
        const ws = MockWebSocket.lastInstance!;

        // Unsubscribe all — starts 500ms debounce
        unsub();
        expect(ws.close).not.toHaveBeenCalled();

        // Resubscribe within the debounce window
        vi.advanceTimersByTime(200);
        provider.watchBalance(ADDR, vi.fn());

        // Let the debounce expire
        vi.advanceTimersByTime(500);

        // WS should still be alive — resubscription cancelled the close
        expect(ws.close).not.toHaveBeenCalled();
    });

    it('close() cancels a pending reconnect', async () => {
        const provider = new TestProvider();
        provider.watchBalance(ADDR, vi.fn());
        await vi.runOnlyPendingTimersAsync();
        const ws = MockWebSocket.lastInstance!;

        provider.triggerClose(); // schedules reconnect at 500ms
        provider.disconnect(); // should cancel it

        vi.advanceTimersByTime(500);
        expect(MockWebSocket.lastInstance).toBe(ws); // no new connection
    });

    it('uses exponential backoff for reconnect delays', async () => {
        const provider = new TestProvider();
        provider.watchBalance(ADDR, vi.fn());
        await vi.runOnlyPendingTimersAsync();
        const ws1 = MockWebSocket.lastInstance!;

        // First disconnect → attempt 1: 500ms
        provider.triggerClose();
        vi.advanceTimersByTime(499);
        expect(MockWebSocket.lastInstance).toBe(ws1);
        vi.advanceTimersByTime(1);
        const ws2 = MockWebSocket.lastInstance!;
        expect(ws2).not.toBe(ws1);

        // ws2 fails before connecting → attempt 2: 1000ms
        ws2.onclose?.();
        vi.advanceTimersByTime(999);
        expect(MockWebSocket.lastInstance).toBe(ws2);
        vi.advanceTimersByTime(1);
        expect(MockWebSocket.lastInstance).not.toBe(ws2);
    });

    describe('ref counting', () => {
        it('does not close when one of two watchers unsubscribes', async () => {
            const provider = new TestProvider();
            provider.watchBalance(ADDR, vi.fn());
            const unsub2 = provider.watchBalance(ADDR, vi.fn());

            await vi.runOnlyPendingTimersAsync();
            const ws = MockWebSocket.lastInstance!;

            unsub2();
            expect(ws.close).not.toHaveBeenCalled();
        });

        it('closes when last watcher unsubscribes (after debounce)', async () => {
            const provider = new TestProvider();
            const unsub1 = provider.watchBalance(ADDR, vi.fn());
            const unsub2 = provider.watchBalance(ADDR, vi.fn());

            await vi.runOnlyPendingTimersAsync();
            const ws = MockWebSocket.lastInstance!;

            unsub1();
            unsub2();
            expect(ws.close).not.toHaveBeenCalled();
            vi.advanceTimersByTime(500);
            expect(ws.close).toHaveBeenCalled();
        });

        it('tracks types independently', async () => {
            const provider = new TestProvider();
            const unsubBal = provider.watchBalance(ADDR, vi.fn());
            provider.watchTransactions(ADDR, vi.fn());

            await vi.runOnlyPendingTimersAsync();
            const ws = MockWebSocket.lastInstance!;

            unsubBal();
            expect(ws.close).not.toHaveBeenCalled();
        });

        it('getActiveWatchers reflects current subscriptions', () => {
            const provider = new TestProvider();
            const unsub = provider.watchBalance(ADDR, vi.fn());
            provider.watchTransactions(ADDR, vi.fn());

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

    describe('disconnect / connect', () => {
        it('connect() opens a new WebSocket after close()', async () => {
            const provider = new TestProvider();
            provider.watchBalance(ADDR, vi.fn());
            await vi.runOnlyPendingTimersAsync();
            const ws1 = MockWebSocket.lastInstance!;

            provider.disconnect();
            expect(ws1.close).toHaveBeenCalled();

            provider.connect();
            await vi.runOnlyPendingTimersAsync();
            expect(MockWebSocket.lastInstance).not.toBe(ws1);
            expect(MockWebSocket.lastInstance?.readyState).toBe(MockWebSocket.OPEN);
        });

        it('callbacks are still invoked after close() + connect()', async () => {
            const provider = new TestProvider();
            const cb = vi.fn();
            provider.watchBalance(ADDR, cb);
            await vi.runOnlyPendingTimersAsync();

            provider.disconnect();
            provider.connect();
            await vi.runOnlyPendingTimersAsync();

            const update = { address: ADDR, balance: '100' } as BalanceUpdate;
            provider.triggerBalanceUpdate(ADDR, update);

            expect(cb).toHaveBeenCalledWith(update);
        });

        it('multiple callbacks all fire after reconnect', async () => {
            const provider = new TestProvider();
            const cb1 = vi.fn();
            const cb2 = vi.fn();
            provider.watchBalance(ADDR, cb1);
            provider.watchBalance(ADDR, cb2);
            await vi.runOnlyPendingTimersAsync();

            provider.disconnect();
            provider.connect();
            await vi.runOnlyPendingTimersAsync();

            const update = { address: ADDR, balance: '200' } as BalanceUpdate;
            provider.triggerBalanceUpdate(ADDR, update);

            expect(cb1).toHaveBeenCalledWith(update);
            expect(cb2).toHaveBeenCalledWith(update);
        });

        it('unsubscribed callback does not fire after reconnect', async () => {
            const provider = new TestProvider();
            const cb1 = vi.fn();
            const cb2 = vi.fn();
            provider.watchBalance(ADDR, cb1);
            const unsub2 = provider.watchBalance(ADDR, cb2);
            await vi.runOnlyPendingTimersAsync();

            unsub2();
            provider.disconnect();
            provider.connect();
            await vi.runOnlyPendingTimersAsync();

            provider.triggerBalanceUpdate(ADDR, { address: ADDR, balance: '50' } as BalanceUpdate);

            expect(cb1).toHaveBeenCalledTimes(1);
            expect(cb2).not.toHaveBeenCalled();
        });

        it('connect() is a no-op when already connected', async () => {
            const provider = new TestProvider();
            provider.watchBalance(ADDR, vi.fn());
            await vi.runOnlyPendingTimersAsync();
            const ws1 = MockWebSocket.lastInstance!;

            provider.connect();
            expect(MockWebSocket.lastInstance).toBe(ws1);
        });
    });
});
