/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect } from 'vitest';

import { stakingProviderInitExample, stakingProviderRegisterExample } from './tonstakers';

describe('Staking provider examples', () => {
    it('STAKING_PROVIDER_INIT initialises AppKit with Tonstakers registered', async () => {
        const appKit = await stakingProviderInitExample();
        expect(appKit.stakingManager.hasProvider('tonstakers')).toBe(true);
    });

    it('STAKING_PROVIDER_REGISTER registers Tonstakers via the action', async () => {
        const appKit = await stakingProviderRegisterExample();
        expect(appKit.stakingManager.hasProvider('tonstakers')).toBe(true);
    });
});
