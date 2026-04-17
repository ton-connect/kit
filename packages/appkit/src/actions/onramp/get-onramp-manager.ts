/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OnrampManager } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';

export type GetOnrampManagerReturnType = OnrampManager;

/**
 * Get onramp manager instance
 */
export const getOnrampManager = (appKit: AppKit): GetOnrampManagerReturnType => {
    return appKit.onrampManager;
};
