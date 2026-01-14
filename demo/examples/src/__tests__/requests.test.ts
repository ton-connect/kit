/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { mockHandlers } from '../__mocks__/@ton/walletkit';
import { resetKitCache } from '../lib/walletKitInitializeSample';
import { main } from '../requests';

describe('requests', () => {
    beforeEach(() => {
        resetKitCache();
        // Clear mock handlers
        mockHandlers.connect = undefined;
        mockHandlers.transaction = undefined;
        mockHandlers.signData = undefined;
        mockHandlers.disconnect = undefined;
    });

    it('should setup request handlers and close on CI', async () => {
        await expect(main()).resolves.not.toThrow();
    });

    it('should handle connect request with approval', async () => {
        await main();

        // Trigger the connect handler with a "Connect to" message that will be approved
        if (mockHandlers.connect) {
            await mockHandlers.connect({
                preview: { permissions: [] },
                dAppInfo: { name: 'TestDApp' },
            });
        }
    });

    it('should handle connect request with rejection', async () => {
        await main();

        // Trigger the connect handler without "Connect to" - will be rejected
        if (mockHandlers.connect) {
            await mockHandlers.connect({
                preview: { permissions: [] },
                dAppInfo: { name: undefined },
            });
        }
    });

    it('should handle connect request error', async () => {
        await main();

        // Trigger with error condition
        if (mockHandlers.connect) {
            const originalConsoleError = console.error;
            console.error = () => {};
            try {
                // Pass an object that will cause an error
                await mockHandlers.connect({
                    preview: { permissions: [] },
                    dAppInfo: {
                        name: {
                            toString: () => {
                                throw new Error('test');
                            },
                        } as unknown as string,
                    },
                });
            } catch {
                // Expected error
            }
            console.error = originalConsoleError;
        }
    });

    it('should handle transaction request with rejection', async () => {
        await main();

        if (mockHandlers.transaction) {
            await mockHandlers.transaction({ preview: {} });
        }
    });

    it('should handle sign data request with rejection', async () => {
        await main();

        if (mockHandlers.signData) {
            await mockHandlers.signData({ preview: {} });
        }
    });

    it('should handle disconnect event', async () => {
        await main();

        if (mockHandlers.disconnect) {
            mockHandlers.disconnect({ walletAddress: 'EQTest123' });
        }
    });
});
