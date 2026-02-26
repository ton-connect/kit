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
    BatchedIntentEvent,
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
                    manifestUrl: 'https://example.com',
                    payload: { data: { type: 'text', value: { content: 'test' } } },
                },
            };

            const result = await handler.rejectIntent(event, 'Not supported', 400);

            expect(result.error.code).toBe(400);
            expect(result.error.message).toBe('Not supported');
        });

        it('emits batch with connect item for single-item intent with connect', async () => {
            let emitted: IntentRequestEvent | BatchedIntentEvent | undefined;
            handler.onIntentRequest((e) => {
                emitted = e;
            });

            const url = buildInlineUrl('c1', {
                id: 'tx-pcr',
                m: 'txIntent',
                i: [{ t: 'ton', a: 'EQAddr', am: '100' }],
                c: { manifestUrl: 'https://dapp.com/m.json', items: [{ name: 'ton_addr' }] },
            });
            await handler.handleIntentUrl(url, 'wallet-1');

            // Should be a batch because of connect
            expect(emitted).toBeDefined();
            expect('intents' in emitted!).toBe(true);
            const batch = emitted as BatchedIntentEvent;
            expect(batch.intents[0].type).toBe('connect');
            expect(batch.intents[1].type).toBe('transaction');
        });
    });

    // ── handleIntentUrl batching ────────────────────────────────────────────

    describe('handleIntentUrl batching', () => {
        it('emits BatchedIntentEvent for multi-item txIntent', async () => {
            let emitted: IntentRequestEvent | BatchedIntentEvent | undefined;
            handler.onIntentRequest((e) => {
                emitted = e;
            });

            const url = buildInlineUrl('c-batch', {
                id: 'tx-batch',
                m: 'txIntent',
                i: [
                    { t: 'ton', a: 'EQAddr1', am: '100' },
                    { t: 'ton', a: 'EQAddr2', am: '200' },
                ],
            });

            await handler.handleIntentUrl(url, 'wallet-1');

            expect(emitted).toBeDefined();
            // BatchedIntentEvent has `intents` array
            expect('intents' in emitted!).toBe(true);

            const batch = emitted as BatchedIntentEvent;
            expect(batch.id).toBe('tx-batch');
            expect(batch.origin).toBe('deepLink');
            expect(batch.clientId).toBe('c-batch');
            expect(batch.intents).toHaveLength(2);

            // Each inner event is a transaction with one item
            expect(batch.intents[0].type).toBe('transaction');
            expect(batch.intents[0].value.id).toBe('tx-batch_0');
            expect(batch.intents[0].value.items).toHaveLength(1);

            expect(batch.intents[1].type).toBe('transaction');
            expect(batch.intents[1].value.id).toBe('tx-batch_1');
            expect(batch.intents[1].value.items).toHaveLength(1);
        });

        it('emits regular IntentRequestEvent for single-item txIntent', async () => {
            let emitted: IntentRequestEvent | BatchedIntentEvent | undefined;
            handler.onIntentRequest((e) => {
                emitted = e;
            });

            const url = buildInlineUrl('c-single', {
                id: 'tx-single',
                m: 'txIntent',
                i: [{ t: 'ton', a: 'EQAddr1', am: '100' }],
            });

            await handler.handleIntentUrl(url, 'wallet-1');

            expect(emitted).toBeDefined();
            // Regular event does NOT have `intents`
            expect('intents' in emitted!).toBe(false);
            expect((emitted as IntentRequestEvent).type).toBe('transaction');
        });

        it('emits connect as first item in batch when connect request present', async () => {
            let emitted: IntentRequestEvent | BatchedIntentEvent | undefined;
            handler.onIntentRequest((e) => {
                emitted = e;
            });

            const url = buildInlineUrl('c-conn', {
                id: 'tx-conn',
                m: 'txIntent',
                i: [
                    { t: 'ton', a: 'EQAddr1', am: '100' },
                    { t: 'ton', a: 'EQAddr2', am: '200' },
                ],
                c: { manifestUrl: 'https://dapp.com/m.json', items: [{ name: 'ton_addr' }] },
            });

            await handler.handleIntentUrl(url, 'wallet-1');

            const batch = emitted as BatchedIntentEvent;
            // Connect is the first item
            expect(batch.intents[0].type).toBe('connect');
            // Followed by transaction items
            expect(batch.intents[1].type).toBe('transaction');
            expect(batch.intents[2].type).toBe('transaction');
            expect(batch.intents).toHaveLength(3);
        });
    });

    // ── approveBatchedIntent ────────────────────────────────────────────────

    describe('approveBatchedIntent', () => {
        function makeBatch(overrides: Partial<BatchedIntentEvent> = {}): BatchedIntentEvent {
            return {
                id: 'batch-1',
                origin: 'deepLink',
                clientId: 'client-b',
                intents: [
                    {
                        type: 'transaction',
                        value: {
                            id: 'batch-1_0',
                            origin: 'deepLink',
                            clientId: 'client-b',
                            deliveryMode: 'send',
                            items: [{ type: 'sendTon', value: { address: 'EQAddr1', amount: '100' } }],
                        },
                    },
                    {
                        type: 'transaction',
                        value: {
                            id: 'batch-1_1',
                            origin: 'deepLink',
                            clientId: 'client-b',
                            deliveryMode: 'send',
                            items: [{ type: 'sendTon', value: { address: 'EQAddr2', amount: '200' } }],
                        },
                    },
                ],
                ...overrides,
            };
        }

        it('signs and sends a combined transaction', async () => {
            const result = await handler.approveBatchedIntent(makeBatch(), 'wallet-1');

            expect(result.boc).toBe('signed-boc-base64');
            expect(mockWallet.getSignedSendTransaction).toHaveBeenCalledTimes(1);
            expect(
                (mockWallet.getClient() as unknown as { sendBoc: ReturnType<typeof vi.fn> }).sendBoc,
            ).toHaveBeenCalledWith('signed-boc-base64');
            expect(bridgeManager.sendIntentResponse).toHaveBeenCalled();
        });

        it('uses signOnly when any inner event has signOnly delivery', async () => {
            const batch = makeBatch();
            (batch.intents[1].value as TransactionIntentRequestEvent).deliveryMode = 'signOnly';

            await handler.approveBatchedIntent(batch, 'wallet-1');

            // Should NOT send boc
            expect(
                (mockWallet.getClient() as unknown as { sendBoc: ReturnType<typeof vi.fn> }).sendBoc,
            ).not.toHaveBeenCalled();
        });

        it('throws when batch contains no transaction items', async () => {
            const emptyBatch = makeBatch({
                intents: [
                    {
                        type: 'signData',
                        value: {
                            id: 'sd-1',
                            origin: 'deepLink',
                            clientId: 'client-b',
                            manifestUrl: 'https://example.com',
                            payload: { data: { type: 'text', value: { content: 'x' } } },
                        },
                    },
                ],
            });

            await expect(handler.approveBatchedIntent(emptyBatch, 'wallet-1')).rejects.toThrow(
                'Batched intent contains no transaction items',
            );
        });

        it('skips bridge send when batch has no clientId', async () => {
            const batch = makeBatch({ clientId: undefined });
            await handler.approveBatchedIntent(batch, 'wallet-1');
            expect(bridgeManager.sendIntentResponse).not.toHaveBeenCalled();
        });
    });

    // ── rejectIntent (batched) ──────────────────────────────────────────────

    describe('rejectIntent (batched)', () => {
        function makeBatch(): BatchedIntentEvent {
            return {
                id: 'batch-r',
                origin: 'deepLink',
                clientId: 'client-br',
                intents: [
                    {
                        type: 'transaction',
                        value: {
                            id: 'batch-r_0',
                            origin: 'deepLink',
                            clientId: 'client-br',
                            deliveryMode: 'send',
                            items: [{ type: 'sendTon', value: { address: 'EQ1', amount: '100' } }],
                        },
                    },
                ],
            };
        }

        it('rejects a batched intent with default error', async () => {
            const result = await handler.rejectIntent(makeBatch());

            expect(result.error.code).toBe(300);
            expect(result.error.message).toBe('User declined the request');
            expect(bridgeManager.sendIntentResponse).toHaveBeenCalled();
        });

        it('rejects a batched intent with custom reason', async () => {
            const result = await handler.rejectIntent(makeBatch(), 'Batch rejected', 500);

            expect(result.error.code).toBe(500);
            expect(result.error.message).toBe('Batch rejected');
        });

        it('rejects a batch that includes a connect item', async () => {
            const batch: BatchedIntentEvent = {
                id: 'batch-pcr',
                origin: 'deepLink',
                clientId: 'cr',
                intents: [
                    {
                        type: 'connect',
                        value: {
                            id: 'batch-pcr',
                            from: 'cr',
                            requestedItems: [],
                            preview: { permissions: [] },
                        },
                    },
                ],
            };
            const result = await handler.rejectIntent(batch);
            expect(result.error.code).toBe(300);
            expect(bridgeManager.sendIntentResponse).toHaveBeenCalled();
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
