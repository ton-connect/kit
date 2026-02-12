/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Provider } from '../../types/provider';
import type { AppKit } from '../../core/app-kit';

export type RegisterProviderOptions = Provider;

/**
 * Register provider
 */
export const registerProvider = (appKit: AppKit, provider: RegisterProviderOptions): void => {
    appKit.registerProvider(provider);
};
