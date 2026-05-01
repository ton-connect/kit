/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';

export interface SetDefaultSwapProviderParameters {
    providerId: string;
}

export type SetDefaultSwapProviderReturnType = void;

/**
 * Set the default swap provider.
 * Subsequent quote and swap-transaction calls will use this provider when none is specified.
 */
export const setDefaultSwapProvider = (
    appKit: AppKit,
    parameters: SetDefaultSwapProviderParameters,
): SetDefaultSwapProviderReturnType => {
    appKit.swapManager.setDefaultProvider(parameters.providerId);
};
