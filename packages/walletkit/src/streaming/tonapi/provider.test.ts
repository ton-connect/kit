/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { TonApiStreamingProvider } from './provider';
import type { ProviderFactoryContext } from '../../types/factory';
import { Network } from '../../api/models';

class MockWebSocket {
    static OPEN = 1;
    static CONNECTING = 0;

    readyState = MockWebSocket.CONNECTING;
    send = vi.fn();
    close = vi.fn();
    onopen: (() => void) | null = null;

    constructor(public url: string) {
        MockWebSocket.lastInstance = this;
        setTimeout(() => {
            this.readyState = MockWebSocket.OPEN;
            if (this.onopen) this.onopen();
        }, 10);
    }

    static lastInstance: MockWebSocket | null = null;
}

(global as unknown as { WebSocket: unknown }).WebSocket = MockWebSocket;

const ADDR = '0:83dfd552e63729b472fcbcc8c44e6cc6691702558b68ecb527e1ba403a0f31a8';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeContext = (): ProviderFactoryContext => ({ networkManager: {} as any, eventEmitter: {} as any });

describe('TonApiStreamingProvider', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        MockWebSocket.lastInstance = null;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('connects to testnet TonAPI URL by default', () => {
        const provider = new TonApiStreamingProvider(makeContext(), { network: Network.testnet() });
        provider.watchBalance(ADDR, vi.fn());
        expect(MockWebSocket.lastInstance?.url).toContain('testnet.tonapi.io');
        expect(MockWebSocket.lastInstance?.url).toContain('/streaming/v2/ws');
    });

    it('connects to mainnet TonAPI URL when network is mainnet', () => {
        const provider = new TonApiStreamingProvider(makeContext(), { network: Network.mainnet() });
        provider.watchBalance(ADDR, vi.fn());
        expect(MockWebSocket.lastInstance?.url).toContain('tonapi.io');
        expect(MockWebSocket.lastInstance?.url).not.toContain('testnet');
    });

    it('appends token to URL when provided', () => {
        const provider = new TonApiStreamingProvider(makeContext(), {
            network: Network.testnet(),
            apiKey: 'secret-token',
        });
        provider.watchBalance(ADDR, vi.fn());
        expect(MockWebSocket.lastInstance?.url).toContain('token=secret-token');
        expect(MockWebSocket.lastInstance?.url).not.toContain('api_key=');
    });

    it('uses custom endpoint as full WebSocket URL without appending streaming path', () => {
        const provider = new TonApiStreamingProvider(makeContext(), {
            network: Network.testnet(),
            endpoint: 'wss://custom.example/v2/ws',
        });
        provider.watchBalance(ADDR, vi.fn());
        expect(MockWebSocket.lastInstance?.url).toBe('wss://custom.example/v2/ws');
    });
});
