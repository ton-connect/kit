/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AppKit, Network } from '@ton/appkit';

import { dedustQuickStartExample } from './dedust';
import { omnistonQuickStartExample, swapProviderInitExample, swapProviderRegisterExample } from './omniston';

describe('Swap provider examples', () => {
    let appKit: AppKit;

    beforeEach(() => {
        appKit = new AppKit({
            networks: {
                [Network.mainnet().chainId]: {},
            },
        });
    });

    it('DEDUST_QUICK_START registers the DeDust provider on AppKit', () => {
        dedustQuickStartExample(appKit);
        expect(appKit.swapManager.hasProvider('dedust')).toBe(true);
    });

    it('OMNISTON_QUICK_START registers the Omniston provider on AppKit', () => {
        omnistonQuickStartExample(appKit);
        expect(appKit.swapManager.hasProvider('omniston')).toBe(true);
    });

    it('SWAP_PROVIDER_INIT initialises AppKit with both swap providers registered', async () => {
        const initialized = await swapProviderInitExample();
        expect(initialized.swapManager.hasProvider('dedust')).toBe(true);
        expect(initialized.swapManager.hasProvider('omniston')).toBe(true);
    });

    it('SWAP_PROVIDER_REGISTER registers swap providers via the action', async () => {
        const registered = await swapProviderRegisterExample();
        expect(registered.swapManager.hasProvider('dedust')).toBe(true);
        expect(registered.swapManager.hasProvider('omniston')).toBe(true);
    });
});
