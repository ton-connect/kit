/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SwapProviderInterface } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';

export interface GetSwapProviderOptions {
    id?: string;
}

export type GetSwapProviderReturnType = SwapProviderInterface;

export const getSwapProvider = (appKit: AppKit, options: GetSwapProviderOptions = {}): GetSwapProviderReturnType => {
    return appKit.swapManager.getProvider(options.id);
};
