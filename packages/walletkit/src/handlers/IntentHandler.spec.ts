/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { IntentHandler } from './IntentHandler';
import type { BridgeManager } from '../core/BridgeManager';
import type { WalletManager } from '../core/WalletManager';
import type { Wallet } from '../api/interfaces';
import type { TonWalletKitOptions } from '../types';
import type {
    IntentRequestEvent,
    TransactionIntentRequestEvent,
    SignDataIntentRequestEvent,
    SignDataPayload,
} from '../api/models';

/**
 * Create a minimal mock wallet that satisfies IntentHandler's usage.
 */
// Real TON address required by Address.parse in PrepareSignData
const VALID_TON_ADDRESS = 'UQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3AF4';

function createMockWallet(address = VALID_TON_ADDRESS): Wallet {
    return {
        getAddress: vi.fn().mockReturnValue(address),
        getSignedSendTransaction: vi.fn().mockResolvedValue('signed-boc-base64'),
        getSignedSignData: vi.fn().mockResolvedValue('aabbccdd'),
        getClient: vi.fn().mockReturnValue({
            sendBoc: vi.fn().mockResolvedValue(undefined),
        }),
        getJettonWalletAddress: vi.fn().mockResolvedValue('EQJettonWallet'),
        getNetwork: vi.fn().mockReturnValue({ chainId: '-239' }),
        getWalletId: vi.fn().mockReturnValue('wallet-1'),
        getTransactionPreview: vi.fn().mockResolvedValue({ actions: [] }),
    } as unknown as Wallet;
}

function createMockBridgeManager(): BridgeManager {
    return {
        sendIntentResponse: vi.fn().mockResolvedValue(undefined),
    } as unknown as BridgeManager;
}

function createMockWalletManager(wallet?: Wallet): WalletManager {
    return {
        getWallet: vi.fn().mockReturnValue(wallet ?? createMockWallet()),
    } as unknown as WalletManager;
}

const defaultOptions: TonWalletKitOptions = {
    networks: {},
};

describe('IntentHandler', () => {
    let bridgeManager: BridgeManager;
    let walletManager: WalletManager;
    let mockWallet: Wallet;
    let handler: IntentHandler;

    beforeEach(() => {
        bridgeManager = createMockBridgeManager();
        mockWallet = createMockWallet();
        walletManager = createMockWalletManager(mockWallet);
        handler = new IntentHandler(defaultOptions, bridgeManager, walletManager);
    });

    // ── approveTransactionIntent ─────────────────────────────────────────────

    describe('approveTransactionIntent', () => {
        /** Helper to build an event with resolvedTransaction so IntentResolver is bypassed. */
        function txEvent(overrides: Partial<TransactionIntentRequestEvent> = {}): TransactionIntentRequestEvent {
            return {
                id: 'tx-1',
                origin: 'deepLink',
                clientId: 'client-1',
                hasConnectRequest: false,
                deliveryMode: 'send',
                items: [{ type: 'sendTon', value: { address: 'EQAddr', amount: '1000000000' } }],
                resolvedTransaction: {
                    messages: [{ address: 'EQAddr', amount: '1000000000' }],
                    fromAddress: 'UQTestAddr',
                },
                ...overrides,
            };
        }

        it('signs and sends a transaction, returns boc', async () => {
            const result = await handler.approveTransactionIntent(txEvent(), 'wallet-1');

            expect(result.boc).toBe('signed-boc-base64');
            expect(mockWallet.getSignedSendTransaction).toHaveBeenCalled();
            expect(
                (mockWallet.getClient() as unknown as { sendBoc: ReturnType<typeof vi.fn> }).sendBoc,
            ).toHaveBeenCalledWith('signed-boc-base64');
            expect(bridgeManager.sendIntentResponse).toHaveBeenCalled();
        });

        it('does not send boc when deliveryMode is signOnly', async () => {
            const result = await handler.approveTransactionIntent(
                txEvent({ id: 'tx-2', deliveryMode: 'signOnly' }),
                'wallet-1',
            );

            expect(result.boc).toBe('signed-boc-base64');
            expect(
                (mockWallet.getClient() as unknown as { sendBoc: ReturnType<typeof vi.fn> }).sendBoc,
            ).not.toHaveBeenCalled();
        });

        it('does not send boc when dev.disableNetworkSend is true', async () => {
            const devHandler = new IntentHandler(
                { ...defaultOptions, dev: { disableNetworkSend: true } },
                bridgeManager,
                walletManager,
            );

            await devHandler.approveTransactionIntent(txEvent({ id: 'tx-3' }), 'wallet-1');
            expect(
                (mockWallet.getClient() as unknown as { sendBoc: ReturnType<typeof vi.fn> }).sendBoc,
            ).not.toHaveBeenCalled();
        });

        it('skips bridge send when clientId is absent', async () => {
            await handler.approveTransactionIntent(txEvent({ id: 'tx-4', clientId: '' }), 'wallet-1');
            expect(bridgeManager.sendIntentResponse).not.toHaveBeenCalled();
        });
    });

    // ── approveSignDataIntent ────────────────────────────────────────────────

    describe('approveSignDataIntent', () => {
        const signPayload: SignDataPayload = {
            data: { type: 'text', value: { content: 'Sign this' } },
        };

        it('signs data and returns result', async () => {
            const event: SignDataIntentRequestEvent = {
                id: 'sd-1',
                origin: 'deepLink',
                clientId: 'client-1',
                hasConnectRequest: false,
                manifestUrl: 'https://example.com/manifest.json',
                payload: signPayload,
            };

            const result = await handler.approveSignDataIntent(event, 'wallet-1');

            expect(result.signature).toBeDefined();
            expect(result.address).toBe(VALID_TON_ADDRESS);
            expect(result.timestamp).toBeDefined();
            expect(result.domain).toBe('example.com');
            expect(mockWallet.getSignedSignData).toHaveBeenCalled();
            expect(bridgeManager.sendIntentResponse).toHaveBeenCalled();
        });

        it('falls back to raw manifestUrl for domain on invalid URL', async () => {
            const event: SignDataIntentRequestEvent = {
                id: 'sd-2',
                origin: 'deepLink',
                clientId: 'client-1',
                hasConnectRequest: false,
                manifestUrl: 'not-a-valid-url',
                payload: signPayload,
            };

            const result = await handler.approveSignDataIntent(event, 'wallet-1');
            expect(result.domain).toBe('not-a-valid-url');
        });
    });

    // ── rejectIntent ─────────────────────────────────────────────────────────

    describe('rejectIntent', () => {
        it('sends error response with user declined code by default', async () => {
            const event: IntentRequestEvent = {
                type: 'transaction',
                value: {
                    id: 'tx-r1',
                    origin: 'deepLink',
                    clientId: 'client-1',
                    hasConnectRequest: false,
                    deliveryMode: 'send',
                    items: [],
                },
            };

            const result = await handler.rejectIntent(event);

            expect(result.error.code).toBe(300); // USER_DECLINED
            expect(result.error.message).toBe('User declined the request');
            expect(bridgeManager.sendIntentResponse).toHaveBeenCalled();
        });

        it('uses custom reason and error code', async () => {
            const event: IntentRequestEvent = {
                type: 'signData',
                value: {
                    id: 'sd-r1',
                    origin: 'deepLink',
                    clientId: 'client-1',
                    hasConnectRequest: false,
                    manifestUrl: 'https://example.com',
                    payload: { data: { type: 'text', value: { content: 'test' } } },
                },
            };

            const result = await handler.rejectIntent(event, 'Not supported', 400);

            expect(result.error.code).toBe(400);
            expect(result.error.message).toBe('Not supported');
        });

        it('cleans up pending connect request on reject', async () => {
            // Store a pending connect request
            const url = buildInlineUrl('c1', {
                id: 'tx-pcr',
                m: 'txIntent',
                i: [{ t: 'ton', a: 'EQAddr', am: '100' }],
                c: { manifestUrl: 'https://dapp.com/m.json', items: [{ name: 'ton_addr' }] },
            });
            await handler.handleIntentUrl(url, 'wallet-1');

            // Should have pending connect request
            expect(handler.getPendingConnectRequest('tx-pcr')).toBeDefined();

            // Reject
            const event: IntentRequestEvent = {
                type: 'transaction',
                value: {
                    id: 'tx-pcr',
                    origin: 'deepLink',
                    clientId: 'c1',
                    hasConnectRequest: true,
                    deliveryMode: 'send',
                    items: [],
                },
            };
            await handler.rejectIntent(event);

            // Pending connect request should be cleaned up
            expect(handler.getPendingConnectRequest('tx-pcr')).toBeUndefined();
        });
    });

    // ── getWallet error ──────────────────────────────────────────────────────

    describe('wallet not found', () => {
        it('throws when wallet is not found', async () => {
            const noWalletManager = {
                getWallet: vi.fn().mockReturnValue(undefined),
            } as unknown as WalletManager;
            const h = new IntentHandler(defaultOptions, bridgeManager, noWalletManager);

            const event: TransactionIntentRequestEvent = {
                id: 'tx-nw',
                origin: 'deepLink',
                clientId: 'c1',
                hasConnectRequest: false,
                deliveryMode: 'send',
                items: [{ type: 'sendTon', value: { address: 'EQ1', amount: '100' } }],
                resolvedTransaction: {
                    messages: [{ address: 'EQ1', amount: '100' }],
                    fromAddress: 'UQ1',
                },
            };

            await expect(h.approveTransactionIntent(event, 'missing-wallet')).rejects.toThrow('Wallet not found');
        });
    });
});

/**
 * Helper: Build a tc://intent_inline URL from a wire request object.
 */
function buildInlineUrl(clientId: string, request: Record<string, unknown>, opts?: { traceId?: string }): string {
    const json = JSON.stringify(request);
    const b64 = Buffer.from(json, 'utf-8').toString('base64url');
    let url = `tc://intent_inline?id=${clientId}&r=${b64}`;
    if (opts?.traceId) url += `&trace_id=${opts.traceId}`;
    return url;
}
