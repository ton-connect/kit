/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { CustomProvider } from '../../core/providers';

export interface GetCustomProviderOptions {
    id: string;
}

export type GetCustomProviderReturnType<T extends CustomProvider = CustomProvider> = T | undefined;

/**
 * Get a registered custom provider by id
 */
export const getCustomProvider = <T extends CustomProvider = CustomProvider>(
    appKit: AppKit,
    options: GetCustomProviderOptions,
): GetCustomProviderReturnType<T> => {
    return appKit.customProvidersManager.getProvider<T>(options.id);
};
