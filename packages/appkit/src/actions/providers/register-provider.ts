/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { ProviderInput } from '../../types/provider';

export type RegisterProviderOptions = ProviderInput;

/**
 * Register provider
 */
export const registerProvider = (appKit: AppKit, provider: RegisterProviderOptions): void => {
    appKit.registerProvider(provider);
};
