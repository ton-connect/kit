/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { OnrampParams } from '../../onramp';

export type BuildOnrampUrlOptions<T = unknown> = OnrampParams<T> & {
    providerId?: string;
};

export type BuildOnrampUrlReturnType = Promise<string>;

/**
 * Build onramp URL.
 */
export const buildOnrampUrl = async <T = unknown>(
    appKit: AppKit,
    options: BuildOnrampUrlOptions<T>,
): BuildOnrampUrlReturnType => {
    return appKit.onrampManager.buildOnrampUrl(options, options.providerId);
};
