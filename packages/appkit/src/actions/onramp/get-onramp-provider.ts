/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { OnrampProviderInterface } from '../../onramp';

export interface GetOnrampProviderOptions {
    id?: string;
}

export type GetOnrampProviderReturnType = OnrampProviderInterface;

/**
 * Get onramp provider
 */
export const getOnrampProvider = (
    appKit: AppKit,
    options: GetOnrampProviderOptions = {},
): GetOnrampProviderReturnType => {
    return appKit.onrampManager.getProvider(options.id);
};
