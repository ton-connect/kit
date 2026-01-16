/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
    walletKitInitializeSample,
    tryGetKitSample,
    getSelectedWalletAddress,
    resetKitCache,
} from '../lib/walletKitInitializeSample';

describe('walletKitInitializeSample', () => {
    beforeEach(() => {
        resetKitCache();
    });

    it('should throw when kit is not initialized', () => {
        expect(() => tryGetKitSample()).toThrow('Wallet Kit not Initialized');
    });

    it('should initialize wallet kit', async () => {
        const kit = await walletKitInitializeSample();
        expect(kit).toBeDefined();
    });

    it('should return cached kit on second call', async () => {
        const kit1 = await walletKitInitializeSample();
        const kit2 = await walletKitInitializeSample();
        expect(kit1).toBe(kit2);
    });

    it('should get selected wallet address', async () => {
        await walletKitInitializeSample();
        const address = getSelectedWalletAddress();
        expect(address).toBeDefined();
    });
});
