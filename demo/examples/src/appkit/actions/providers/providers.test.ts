/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppKit } from '@ton/appkit';
import { Network } from '@ton/walletkit';

import { getCustomProviderExample } from './get-custom-provider';

describe('Provider Actions Examples (Integration)', () => {
    let appKit: AppKit;
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        appKit = new AppKit({
            networks: { [Network.mainnet().chainId]: {} },
        });
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe('getCustomProviderExample', () => {
        it('should log when custom provider is available', () => {
            appKit.registerProvider({ providerId: 'tac', type: 'custom' as const });
            getCustomProviderExample(appKit);
            expect(consoleSpy).toHaveBeenCalledWith('TAC provider is available');
        });

        it('should not log when provider is not registered', () => {
            getCustomProviderExample(appKit);
            expect(consoleSpy).not.toHaveBeenCalled();
        });
    });
});
