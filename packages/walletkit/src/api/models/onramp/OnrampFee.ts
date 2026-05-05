/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type OnrampFeeType = 'service' | 'network' | 'processing';

/**
 * A single fee charged for an onramp transaction.
 */
export interface OnrampFee {
    type: OnrampFeeType;
    amount: string;
    currency: string;
}
