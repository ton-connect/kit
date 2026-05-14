/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi } from 'vitest';
import { Result, AssetType } from '@ton/walletkit';

import { applyRenderConnectPreview } from '../ui/render-connect-preview';
import { applySummarizeTransaction } from '../ui/summarize-transaction';
import { applyRenderMoneyFlow } from '../ui/render-money-flow';
import { applyRenderSignDataPreview } from '../ui/render-sign-data-preview';

vi.mock('@ton/walletkit', async () => {
    return await import('../__mocks__/@ton/walletkit');
});

describe('UI rendering functions', () => {
    describe('renderConnectPreview', () => {
        it('should render connect preview with manifest', () => {
            const req = {
                id: 'test-id-1',
                requestedItems: [{ type: 'ton_addr' as const }],
                preview: {
                    dAppInfo: {
                        name: 'Test dApp',
                        description: 'Test description',
                        iconUrl: 'https://example.com/icon.png',
                    },
                    permissions: [{ title: 'Permission 1', description: 'Description 1' }],
                },
                dAppInfo: { name: 'Fallback Name' },
            };

            const result = applyRenderConnectPreview(req);

            expect(result.title).toBe('Connect to Test dApp?');
            expect(result.iconUrl).toBe('https://example.com/icon.png');
            expect(result.description).toBe('Test description');
            expect(result.permissions).toHaveLength(1);
        });

        it('should handle missing permissions field', () => {
            const req = {
                id: 'test-id-3',
                requestedItems: [{ type: 'ton_addr' as const }],
                preview: {
                    dAppInfo: { name: 'Test dApp' },
                    permissions: undefined as unknown as [],
                },
                dAppInfo: { name: 'Fallback Name' },
            };

            const result = applyRenderConnectPreview(req);
            expect(result.permissions).toHaveLength(0);
        });

        it('should fallback to dAppInfo name', () => {
            const req = {
                id: 'test-id-2',
                requestedItems: [{ type: 'ton_addr' as const }],
                preview: {
                    permissions: [],
                },
                dAppInfo: { name: 'Fallback Name' },
            };

            const result = applyRenderConnectPreview(req);
            expect(result.title).toBe('Connect to Fallback Name?');
        });
    });

    describe('summarizeTransaction', () => {
        it('should return error for failed transaction', () => {
            const preview = {
                result: Result.failure,
                error: { message: 'Transaction failed' },
            };

            const result = applySummarizeTransaction(preview);

            expect(result.kind).toBe('error');
            if (result.kind === 'error') {
                expect(result.message).toBe('Transaction failed');
            }
        });

        it('should return unknown error when error message missing', () => {
            const preview = {
                result: Result.failure,
            };

            const result = applySummarizeTransaction(preview);

            expect(result.kind).toBe('error');
            if (result.kind === 'error') {
                expect(result.message).toBe('Unknown error');
            }
        });

        it('should summarize successful transaction with transfers', () => {
            const preview = {
                result: Result.success,
                moneyFlow: {
                    outputs: '0',
                    inputs: '0',
                    allJettonTransfers: [],
                    ourTransfers: [
                        { assetType: AssetType.ton, amount: '-1000000000' },
                        { assetType: AssetType.jetton, amount: '500', tokenAddress: 'EQJetton123' },
                    ],
                },
            };

            const result = applySummarizeTransaction(preview);

            expect(result.kind).toBe('success');
            if (result.kind === 'success' && result.transfers) {
                expect(result.transfers).toHaveLength(2);
                expect(result.transfers[0].jettonAddress).toBe('TON');
                expect(result.transfers[0].isIncoming).toBe(false);
                expect(result.transfers[1].jettonAddress).toBe('EQJetton123');
                expect(result.transfers[1].isIncoming).toBe(true);
            }
        });

        it('should handle empty money flow', () => {
            const preview = {
                result: Result.success,
            };

            const result = applySummarizeTransaction(preview);

            expect(result.kind).toBe('success');
            if (result.kind === 'success' && result.transfers) {
                expect(result.transfers).toHaveLength(0);
            }
        });
    });

    describe('renderMoneyFlow', () => {
        it('should render empty message for no transfers', () => {
            const result = applyRenderMoneyFlow([]);
            expect(result).toBeDefined();
        });

        it('should render money flow for transfers', () => {
            const transfers = [
                { assetType: AssetType.ton, amount: '1000000000' },
                { assetType: AssetType.jetton, amount: '-500', tokenAddress: 'EQJetton123' },
            ];

            const result = applyRenderMoneyFlow(transfers);
            expect(result).toBeDefined();
        });
    });

    describe('renderSignDataPreview', () => {
        it('should render text preview', () => {
            const preview = {
                type: 'text' as const,
                value: { content: 'Hello World' },
            };

            const result = applyRenderSignDataPreview(preview);

            if (result) {
                expect(result.type).toBe('text');
                expect(result.content).toBe('Hello World');
            }
        });

        it('should render binary preview', () => {
            // Base64String is a branded type, so we need to cast for test purposes
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const preview: any = {
                type: 'binary' as const,
                value: { content: '0x123456' },
            };

            const result = applyRenderSignDataPreview(preview);

            if (result) {
                expect(result.type).toBe('binary');
                expect(result.content).toBe('0x123456');
            }
        });

        it('should render cell preview', () => {
            // Base64String is a branded type, so we need to cast for test purposes
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const preview: any = {
                type: 'cell' as const,
                value: {
                    content: 'te6cck...',
                    schema: 'SomeSchema',
                    parsed: { key: 'value' },
                },
            };

            const result = applyRenderSignDataPreview(preview);

            if (result) {
                expect(result.type).toBe('cell');
                expect(result.content).toBe('te6cck...');
                expect(result.schema).toBe('SomeSchema');
                expect(result.parsed).toEqual({ key: 'value' });
            }
        });
    });
});
