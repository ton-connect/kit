/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { mockHandlers } from '../__mocks__/@ton/walletkit';
import { resetKitCache, walletKitInitializeSample } from '../lib/walletKitInitializeSample';
import { createMinimalUiStateWiring, main } from '../ui-state-wiring';

describe('ui-state-wiring', () => {
    beforeEach(() => {
        resetKitCache();
        // Clear mock handlers
        mockHandlers.connect = undefined;
        mockHandlers.transaction = undefined;
    });

    it('should run the example main without throwing', async () => {
        await expect(main()).resolves.not.toThrow();
    });

    it('should setup UI state wiring and call all handlers', async () => {
        const kit = await walletKitInitializeSample();
        const wiring = createMinimalUiStateWiring(kit);

        // no state set yet - should be no-op
        await expect(wiring.approveConnect()).resolves.not.toThrow();
        await expect(wiring.rejectConnect()).resolves.not.toThrow();
        await expect(wiring.approveTx()).resolves.not.toThrow();
        await expect(wiring.rejectTx()).resolves.not.toThrow();
    });

    it('should handle connect request via state wiring', async () => {
        const kit = await walletKitInitializeSample();
        const wiring = createMinimalUiStateWiring(kit);

        // Trigger the connect handler to populate the state, then approve/reject paths
        if (mockHandlers.connect) {
            await mockHandlers.connect({
                preview: { permissions: [] },
                dAppInfo: { name: 'TestDApp' },
            });
        }

        await wiring.approveConnect();

        if (mockHandlers.connect) {
            await mockHandlers.connect({
                preview: { permissions: [] },
                dAppInfo: { name: 'TestDApp' },
            });
        }

        await wiring.rejectConnect();
    });

    it('should handle transaction request via state wiring', async () => {
        const kit = await walletKitInitializeSample();
        const wiring = createMinimalUiStateWiring(kit);

        // Trigger the transaction handler to populate the state, then approve/reject paths
        if (mockHandlers.transaction) {
            await mockHandlers.transaction({ preview: {} });
        }

        await wiring.approveTx();

        if (mockHandlers.transaction) {
            await mockHandlers.transaction({ preview: {} });
        }

        await wiring.rejectTx();
    });
});
