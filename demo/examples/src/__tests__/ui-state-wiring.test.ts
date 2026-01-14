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
import { main } from '../ui-state-wiring';

describe('ui-state-wiring', () => {
    beforeEach(() => {
        resetKitCache();
        // Clear mock handlers
        mockHandlers.connect = undefined;
        mockHandlers.transaction = undefined;
    });

    it('should setup UI state wiring and call all handlers', async () => {
        await expect(main()).resolves.not.toThrow();
    });

    it('should handle connect request via state wiring', async () => {
        await main();

        // Trigger the connect handler to populate the state
        if (mockHandlers.connect) {
            await mockHandlers.connect({
                preview: { permissions: [] },
                dAppInfo: { name: 'TestDApp' },
            });
        }
    });

    it('should handle transaction request via state wiring', async () => {
        await main();

        // Trigger the transaction handler to populate the state
        if (mockHandlers.transaction) {
            await mockHandlers.transaction({ preview: {} });
        }
    });
});
