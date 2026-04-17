/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OnrampProviderInterface } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';

export type GetOnrampProvidersReturnType = OnrampProviderInterface[];

/**
 * Get all registered onramp providers
 */
export const getOnrampProviders = (appKit: AppKit): GetOnrampProvidersReturnType => {
    return appKit.onrampManager.getProviders();
};
