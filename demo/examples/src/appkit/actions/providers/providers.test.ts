/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppKit } from '@ton/appkit';
import { Network } from '@ton/walletkit';

import { registerProviderExample } from './register-provider';

describe('Provider Actions Examples', () => {
    let appKit: AppKit;

    beforeEach(() => {
        vi.clearAllMocks();

        appKit = new AppKit({
            networks: {
                [Network.mainnet().chainId]: {},
            },
        });
    });

    describe('registerProviderExample', () => {
        it('should register a swap provider', () => {
            const spy = vi.spyOn(appKit.swapManager, 'registerProvider');

            registerProviderExample(appKit);

            expect(spy).toHaveBeenCalled();
            // It registers OmnistonSwapProvider
            const registeredProvider = spy.mock.calls[0][0];
            expect(registeredProvider.providerId).toBe('omniston');
        });
    });
});
