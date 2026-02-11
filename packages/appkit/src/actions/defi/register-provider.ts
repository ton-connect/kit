/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SwapProviderInterface } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';

export type RegisterProviderOptions = SwapProviderInterface;

/**
 * Register provider
 */
export const registerProvider = (appKit: AppKit, provider: RegisterProviderOptions): void => {
    switch (provider.type) {
        case 'swap':
            appKit.swapManager.registerProvider(provider);
            break;
        default:
            throw new Error('Unknown provider type');
    }
};
