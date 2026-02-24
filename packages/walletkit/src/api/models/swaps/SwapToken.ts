/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Token type for swap
 */
export type SwapToken = {
    address: string;
    decimals: number;

    name?: string;
    symbol?: string;
    image?: string;
    chainId?: string;
};
