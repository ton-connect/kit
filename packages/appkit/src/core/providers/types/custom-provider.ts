/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BaseProvider } from '@ton/walletkit';

/**
 * A provider with custom functionality registered by a third party.
 * Extend this interface to add your own methods.
 *
 * @example
 * interface TacProvider extends CustomProvider {
 *     sendCrossChainTransaction(params: TacParams): Promise<void>;
 * }
 */
export interface CustomProvider extends BaseProvider {
    readonly type: 'custom';
}
