/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TokenAmount } from '../core/TokenAmount';
import type { SwapToken } from './SwapToken';

/**
 * Fee information for swap
 */
export interface SwapFee {
    /**
     * Amount of the fee
     */
    amount: TokenAmount;

    /**
     * Token in which the fee is paid
     */
    token: SwapToken;
}
