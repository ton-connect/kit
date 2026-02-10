/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SwapProviderInterface } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';

export type RegisterSwapProviderOptions = SwapProviderInterface;

/**
 * Register swap provider
 */
export const registerSwapProvider = (appKit: AppKit, provider: RegisterSwapProviderOptions): void => {
    appKit.swapManager.registerProvider(provider);
};
