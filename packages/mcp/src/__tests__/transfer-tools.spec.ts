/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it, vi } from 'vitest';

import { createMcpTransferTools } from '../tools/transfer-tools.js';

function parseToolResult(
    result: Awaited<ReturnType<ReturnType<typeof createMcpTransferTools>['send_ton']['handler']>>,
) {
    const first = result.content[0];
    if (!first || first.type !== 'text') {
        throw new Error('Expected text tool response');
    }
    return JSON.parse(first.text) as Record<string, unknown>;
}

describe('transfer tools', () => {
    it('returns normalizedHash at the top level for send tools', async () => {
        const service = {
            sendTon: vi.fn(async () => ({
                success: true,
                message: 'TON sent',
                normalizedHash: 'hash-ton',
            })),
            getJettons: vi.fn(async () => [
                {
                    address: 'EQJetton',
                    decimals: 9,
                    symbol: 'JET',
                },
            ]),
            sendJetton: vi.fn(async () => ({
                success: true,
                message: 'Jetton sent',
                normalizedHash: 'hash-jetton',
            })),
            sendRawTransaction: vi.fn(async () => ({
                success: true,
                message: 'Raw transaction sent',
                normalizedHash: 'hash-raw',
            })),
        } as never;

        const tools = createMcpTransferTools(service);

        const tonResult = parseToolResult(
            await tools.send_ton.handler({
                toAddress: 'EQTo',
                amount: '1.5',
            }),
        );
        expect(tonResult).toMatchObject({
            success: true,
            normalizedHash: 'hash-ton',
        });

        const jettonResult = parseToolResult(
            await tools.send_jetton.handler({
                toAddress: 'EQTo',
                jettonAddress: 'EQJetton',
                amount: '2.5',
            }),
        );
        expect(jettonResult).toMatchObject({
            success: true,
            normalizedHash: 'hash-jetton',
        });

        const rawResult = parseToolResult(
            await tools.send_raw_transaction.handler({
                messages: [{ address: 'EQTo', amount: '123' }],
            }),
        );
        expect(rawResult).toMatchObject({
            success: true,
            normalizedHash: 'hash-raw',
        });
    });
});
