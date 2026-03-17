/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it, vi } from 'vitest';

import { McpWalletService } from '../services/McpWalletService.js';

describe('McpWalletService.getTransactions', () => {
    it('uses a safe traces limit and slices the result back to the requested amount', async () => {
        const getEvents = vi.fn().mockResolvedValue({
            events: [
                {
                    eventId: 'event-1',
                    timestamp: 100,
                    isScam: false,
                    actions: [
                        {
                            type: 'TonTransfer',
                            status: 'success',
                            simplePreview: { description: 'First transfer' },
                            TonTransfer: {
                                sender: { address: 'EQSender1' },
                                recipient: { address: 'EQRecipient1' },
                                amount: 10n,
                                comment: 'first',
                            },
                        },
                    ],
                },
                {
                    eventId: 'event-2',
                    timestamp: 200,
                    isScam: false,
                    actions: [
                        {
                            type: 'TonTransfer',
                            status: 'success',
                            simplePreview: { description: 'Second transfer' },
                            TonTransfer: {
                                sender: { address: 'EQSender2' },
                                recipient: { address: 'EQRecipient2' },
                                amount: 20n,
                                comment: 'second',
                            },
                        },
                    ],
                },
                {
                    eventId: 'event-3',
                    timestamp: 300,
                    isScam: false,
                    actions: [
                        {
                            type: 'TonTransfer',
                            status: 'success',
                            simplePreview: { description: 'Third transfer' },
                            TonTransfer: {
                                sender: { address: 'EQSender3' },
                                recipient: { address: 'EQRecipient3' },
                                amount: 30n,
                                comment: 'third',
                            },
                        },
                    ],
                },
            ],
        });

        const service = Object.create(McpWalletService.prototype) as McpWalletService & {
            wallet: {
                getAddress: () => string;
                getClient: () => { getEvents: typeof getEvents };
            };
        };
        Object.defineProperty(service, 'wallet', {
            value: {
                getAddress: () => 'UQTestWallet',
                getClient: () => ({ getEvents }),
            },
            configurable: true,
        });

        const result = await service.getTransactions(2);

        expect(getEvents).toHaveBeenCalledWith({
            account: 'UQTestWallet',
            limit: 10,
            offset: 0,
        });
        expect(result).toHaveLength(2);
        expect(result.map((item) => item.eventId)).toEqual(['event-1', 'event-2']);
        expect(result[0]).toMatchObject({
            type: 'TonTransfer',
            from: 'EQSender1',
            to: 'EQRecipient1',
            amount: '10',
            comment: 'first',
        });
    });

    it('keeps the requested limit when it is already safe for traces', async () => {
        const getEvents = vi.fn().mockResolvedValue({
            events: [],
        });

        const service = Object.create(McpWalletService.prototype) as McpWalletService & {
            wallet: {
                getAddress: () => string;
                getClient: () => { getEvents: typeof getEvents };
            };
        };
        Object.defineProperty(service, 'wallet', {
            value: {
                getAddress: () => 'UQTestWallet',
                getClient: () => ({ getEvents }),
            },
            configurable: true,
        });

        await service.getTransactions(25);

        expect(getEvents).toHaveBeenCalledWith({
            account: 'UQTestWallet',
            limit: 25,
            offset: 0,
        });
    });
});
