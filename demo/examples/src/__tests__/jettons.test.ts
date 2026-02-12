/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { resetKitCache } from '../lib/wallet-kit-initialize-sample';
import { main } from '../jettons';

vi.mock('@ton/walletkit', async () => {
    return await import('../__mocks__/@ton/walletkit');
});

describe('jettons', () => {
    beforeEach(() => {
        resetKitCache();
    });

    it('should get jetton info', async () => {
        await expect(main()).resolves.not.toThrow();
    });
});
