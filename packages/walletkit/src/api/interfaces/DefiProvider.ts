/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BaseProvider } from '../models';

/**
 * Type of provider
 */
export type DefiProviderType = 'swap' | 'staking';

/**
 * Base interface for all DeFi providers
 */
export interface DefiProvider extends BaseProvider {
    readonly type: DefiProviderType;
}
