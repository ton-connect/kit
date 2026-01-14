/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect } from 'vitest';

import { applyRenderConnectPreview } from '../ui/renderConnectPreview';
import { applySummarizeTransaction } from '../ui/summarizeTransaction';
import { applyRenderMoneyFlow } from '../ui/renderMoneyFlow';
import { applyRenderSignDataPreview } from '../ui/renderSignDataPreview';

describe('UI rendering functions', () => {
    describe('renderConnectPreview', () => {
        it('should render connect preview with manifest', () => {
            const req = {
                preview: {
                    manifest: {
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

        it('should fallback to dAppInfo name', () => {
            const req = {
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
                result: 'error' as const,
                error: { message: 'Transaction failed' },
            };

            const result = applySummarizeTransaction(preview);

            expect(result.kind).toBe('error');
            if (result.kind === 'error') {
                expect(result.message).toBe('Transaction failed');
            }
        });

        it('should summarize successful transaction with transfers', () => {
            const preview = {
                result: 'success' as const,
                moneyFlow: {
                    ourTransfers: [
                        { assetType: 'ton' as const, amount: '-1000000000' },
                        { assetType: 'jetton' as const, amount: '500', tokenAddress: 'EQJetton123' },
                    ],
                },
            };

            const result = applySummarizeTransaction(preview);

            expect(result.kind).toBe('success');
            if (result.kind === 'success') {
                expect(result.transfers).toHaveLength(2);
                expect(result.transfers[0].jettonAddress).toBe('TON');
                expect(result.transfers[0].isIncoming).toBe(false);
                expect(result.transfers[1].jettonAddress).toBe('EQJetton123');
                expect(result.transfers[1].isIncoming).toBe(true);
            }
        });

        it('should handle empty money flow', () => {
            const preview = {
                result: 'success' as const,
            };

            const result = applySummarizeTransaction(preview);

            expect(result.kind).toBe('success');
            if (result.kind === 'success') {
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
                { assetType: 'ton' as const, amount: '1000000000' },
                { assetType: 'jetton' as const, amount: '-500', tokenAddress: 'EQJetton123' },
            ];

            const result = applyRenderMoneyFlow(transfers);
            expect(result).toBeDefined();
        });
    });

    describe('renderSignDataPreview', () => {
        it('should render text preview', () => {
            const preview = {
                kind: 'text' as const,
                content: 'Hello World',
            };

            const result = applyRenderSignDataPreview(preview);

            expect(result.type).toBe('text');
            expect(result.content).toBe('Hello World');
        });

        it('should render binary preview', () => {
            const preview = {
                kind: 'binary' as const,
                content: '0x123456',
            };

            const result = applyRenderSignDataPreview(preview);

            expect(result.type).toBe('binary');
            expect(result.content).toBe('0x123456');
        });

        it('should render cell preview', () => {
            const preview = {
                kind: 'cell' as const,
                content: 'te6cck...',
                schema: 'SomeSchema',
                parsed: { key: 'value' },
            };

            const result = applyRenderSignDataPreview(preview);

            expect(result.type).toBe('cell');
            expect(result.content).toBe('te6cck...');
            expect(result.schema).toBe('SomeSchema');
            expect(result.parsed).toEqual({ key: 'value' });
        });
    });
});
