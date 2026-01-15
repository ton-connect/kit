/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { mockHandlers } from '../__mocks__/@ton/walletkit';
import type { ConnectionRequestEvent } from '../__mocks__/@ton/walletkit';
import { resetKitCache, tryGetKitSample } from '../lib/walletKitInitializeSample';
import { main } from '../requests';

describe('requests', () => {
    beforeEach(() => {
        resetKitCache();
        process.env.EXAMPLES_AUTO_APPROVE = undefined;
        process.env.EXAMPLES_AUTO_REJECT = undefined;
        // Clear mock handlers
        mockHandlers.connect = undefined;
        mockHandlers.transaction = undefined;
        mockHandlers.signData = undefined;
        mockHandlers.disconnect = undefined;
    });

    afterEach(() => {
        process.env.EXAMPLES_AUTO_APPROVE = undefined;
        process.env.EXAMPLES_AUTO_REJECT = undefined;
    });

    it('should setup request handlers and close on CI', async () => {
        await expect(main()).resolves.not.toThrow();
    });

    it('should handle connect request with approval', async () => {
        process.env.EXAMPLES_AUTO_APPROVE = 'true';
        await main();

        // Trigger the connect handler with a "Connect to" message that will be approved
        if (mockHandlers.connect) {
            const event: ConnectionRequestEvent = {
                preview: { permissions: [] },
                dAppInfo: { name: 'TestDApp' },
            };
            await mockHandlers.connect(event);

            const kit = tryGetKitSample();
            expect(kit.approveConnectRequest).toHaveBeenCalled();
            expect(event.walletId).toBeDefined();
        }
    });

    it('should handle connect request with rejection', async () => {
        process.env.EXAMPLES_AUTO_REJECT = 'true';
        await main();

        // Force reject via env var
        if (mockHandlers.connect) {
            await mockHandlers.connect({
                preview: { permissions: [] },
                dAppInfo: { name: undefined },
            });

            const kit = tryGetKitSample();
            expect(kit.rejectConnectRequest).toHaveBeenCalled();
        }
    });

    it('should reject connect request when selected wallet not found', async () => {
        process.env.EXAMPLES_AUTO_APPROVE = 'true';
        await main();

        const kit = tryGetKitSample();
        // Make wallet selection return empty wallet id
        kit.getWallets = () => [];

        if (mockHandlers.connect) {
            await mockHandlers.connect({
                preview: { permissions: [] },
                dAppInfo: { name: 'TestDApp' },
            });
        }

        expect(kit.rejectConnectRequest).toHaveBeenCalled();
    });

    it('should handle connect request error', async () => {
        process.env.EXAMPLES_AUTO_APPROVE = 'true';
        await main();

        // Trigger with error condition
        if (mockHandlers.connect) {
            const originalConsoleError = console.error;
            console.error = () => {};
            try {
                const kit = tryGetKitSample();
                // Force an error inside handler flow
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (kit.approveConnectRequest as any) = async () => {
                    throw new Error('test');
                };

                await mockHandlers.connect({
                    preview: { permissions: [] },
                    dAppInfo: {
                        name: 'TestDApp',
                    },
                });
            } catch {
                // Expected error
            }
            console.error = originalConsoleError;

            const kit = tryGetKitSample();
            expect(kit.rejectConnectRequest).toHaveBeenCalled();
        }
    });

    it('should handle transaction request with rejection', async () => {
        await main();

        if (mockHandlers.transaction) {
            await mockHandlers.transaction({ preview: {} });

            const kit = tryGetKitSample();
            expect(kit.rejectTransactionRequest).toHaveBeenCalled();
        }
    });

    it('should handle transaction request with approval', async () => {
        process.env.EXAMPLES_AUTO_APPROVE = 'true';
        await main();

        if (mockHandlers.transaction) {
            await mockHandlers.transaction({ preview: {} });

            const kit = tryGetKitSample();
            expect(kit.approveTransactionRequest).toHaveBeenCalled();
        }
    });

    it('should handle sign data request with rejection', async () => {
        await main();

        if (mockHandlers.signData) {
            await mockHandlers.signData({ preview: {} });

            const kit = tryGetKitSample();
            expect(kit.rejectSignDataRequest).toHaveBeenCalled();
        }
    });

    it('should handle sign data request with approval', async () => {
        process.env.EXAMPLES_AUTO_APPROVE = 'true';
        await main();

        if (mockHandlers.signData) {
            await mockHandlers.signData({ preview: {} });

            const kit = tryGetKitSample();
            expect(kit.approveSignDataRequest).toHaveBeenCalled();
        }
    });

    it('should handle disconnect event', async () => {
        await main();

        if (mockHandlers.disconnect) {
            mockHandlers.disconnect({ walletAddress: 'EQTest123' });
        }
    });
});
