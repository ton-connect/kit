/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { MemoryStorageAdapter, Network } from '@ton/walletkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TonConnectRuntimeService } from '../services/TonConnectRuntimeService.js';
import { TonConnectStore } from '../services/TonConnectStore.js';

describe('TonConnectRuntimeService', () => {
    const walletId = 'mainnet:wallet';
    const walletAddress = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';

    const fakeWallet = {
        getWalletId: () => walletId,
        getAddress: () => walletAddress,
        getNetwork: () => Network.mainnet(),
    };

    let onConnectRequest: ((event: Record<string, unknown>) => void) | undefined;
    let onDisconnect: ((event: Record<string, unknown>) => void) | undefined;
    let fakeKit: {
        addWallet: ReturnType<typeof vi.fn>;
        getWallet: ReturnType<typeof vi.fn>;
        handleTonConnectUrl: ReturnType<typeof vi.fn>;
        approveConnectRequest: ReturnType<typeof vi.fn>;
        rejectConnectRequest: ReturnType<typeof vi.fn>;
        listSessions: ReturnType<typeof vi.fn>;
        disconnect: ReturnType<typeof vi.fn>;
        onConnectRequest: ReturnType<typeof vi.fn>;
        onTransactionRequest: ReturnType<typeof vi.fn>;
        onSignDataRequest: ReturnType<typeof vi.fn>;
        onDisconnect: ReturnType<typeof vi.fn>;
        onRequestError: ReturnType<typeof vi.fn>;
        removeConnectRequestCallback: ReturnType<typeof vi.fn>;
        removeTransactionRequestCallback: ReturnType<typeof vi.fn>;
        removeSignDataRequestCallback: ReturnType<typeof vi.fn>;
        removeDisconnectCallback: ReturnType<typeof vi.fn>;
        removeErrorCallback: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        onConnectRequest = undefined;
        onDisconnect = undefined;
        fakeKit = {
            addWallet: vi.fn(async () => fakeWallet),
            getWallet: vi.fn(() => fakeWallet),
            handleTonConnectUrl: vi.fn(async () => {
                await onConnectRequest?.({
                    id: 'connect-1',
                    from: 'session-1',
                    walletId,
                    walletAddress,
                    preview: {
                        dAppInfo: {
                            name: 'Test dApp',
                            url: 'https://example.com',
                        },
                        permissions: [],
                    },
                    requestedItems: [{ type: 'ton_addr' }],
                });
            }),
            approveConnectRequest: vi.fn(async () => undefined),
            rejectConnectRequest: vi.fn(async () => undefined),
            listSessions: vi.fn(async () => [
                {
                    sessionId: 'session-1',
                    walletId,
                    walletAddress,
                    createdAt: '2026-03-20T10:00:00.000Z',
                    lastActivityAt: '2026-03-20T10:01:00.000Z',
                    privateKey: 'secret',
                    publicKey: 'public',
                    domain: 'example.com',
                    dAppName: 'Test dApp',
                    schemaVersion: 1,
                },
            ]),
            disconnect: vi.fn(async () => {
                onDisconnect?.({ sessionId: 'session-1' });
            }),
            onConnectRequest: vi.fn((cb) => {
                onConnectRequest = cb;
            }),
            onTransactionRequest: vi.fn(),
            onSignDataRequest: vi.fn(),
            onDisconnect: vi.fn((cb) => {
                onDisconnect = cb;
            }),
            onRequestError: vi.fn(),
            removeConnectRequestCallback: vi.fn(),
            removeTransactionRequestCallback: vi.fn(),
            removeSignDataRequestCallback: vi.fn(),
            removeDisconnectCallback: vi.fn(),
            removeErrorCallback: vi.fn(),
        };
    });

    it('captures connect requests, approves them, and sanitizes sessions', async () => {
        const runtime = new TonConnectRuntimeService({
            runtimeKey: 'wallet-1',
            config: {
                storagePath: '/tmp/tonconnect-test.json',
                storagePrefix: 'test:',
                bridgeUrl: 'https://connect.ton.org/bridge',
            },
            store: new TonConnectStore(new MemoryStorageAdapter()),
            createContext: async () =>
                ({
                    kit: fakeKit,
                    adapter: fakeWallet,
                    close: async () => undefined,
                }) as never,
        });

        const handled = await runtime.handleUrl('tonconnect://open');
        expect(handled.pendingRequests).toBe(1);

        const requests = await runtime.listRequests({ status: 'pending' });
        expect(requests).toHaveLength(1);
        expect(requests[0]?.summary.type).toBe('connect');

        const approved = await runtime.approveRequest('connect-1');
        expect(approved.request.status).toBe('approved');
        expect(fakeKit.approveConnectRequest).toHaveBeenCalledTimes(1);

        const sessions = await runtime.listSessions();
        expect(sessions).toHaveLength(1);
        expect(sessions[0]).toMatchObject({
            sessionId: 'session-1',
            dAppName: 'Test dApp',
        });
        expect(sessions[0]).not.toHaveProperty('privateKey');
        expect(sessions[0]).not.toHaveProperty('publicKey');

        const disconnected = await runtime.disconnect('session-1');
        expect(disconnected).toMatchObject({
            disconnected: true,
            disconnectedSessions: 1,
        });
    });
});
