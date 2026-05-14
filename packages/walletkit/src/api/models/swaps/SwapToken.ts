/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Token type for swap.
 */
export type SwapToken = {
    /** Token contract address. `'ton'` is used for native TON on the TON chain. */
    address: string;

    /**
     * Number of decimal places used to format raw amounts.
     * @format: int
     */
    decimals: number;

    /** Display name (e.g., `"Tether USD"`). */
    name?: string;
    /** Ticker symbol (e.g., `"USDT"`). */
    symbol?: string;
    /** URL of the token's image. */
    image?: string;
    /** Chain id in CAIP-2 format when the token lives outside TON. */
    chainId?: string;
};
