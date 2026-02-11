/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Type of provider
 */
export type DefiProviderType = 'swap';

/**
 * Base interface for all providers
 */
export interface DefiProvider {
    readonly type: DefiProviderType;

    /**
     * Unique identifier for the provider
     */
    readonly providerId: string;
}
