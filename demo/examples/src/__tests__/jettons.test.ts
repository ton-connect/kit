/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { resetKitCache } from '../lib/walletKitInitializeSample';
import { main } from '../jettons';

describe('jettons', () => {
    beforeEach(() => {
        resetKitCache();
    });

    it('should get jetton info', async () => {
        await expect(main()).resolves.not.toThrow();
    });
});
