/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { formatUnits, parseUnits } from '@ton/appkit';

/** Reserve (in TON) subtracted from balance on MAX click for native TON swaps. */
export const TON_FEE_RESERVE = 0.3;

/**
 * Compute the value to place into fromAmount when the user clicks MAX.
 * For native TON, subtracts {@link TON_FEE_RESERVE} to leave room for network fees.
 * For jettons, returns the full balance as-is (gas is paid from TON separately).
 */
export const calcMaxFromAmount = (balance: string, fromToken: { address: string; decimals: number }): string => {
    if (fromToken.address !== 'ton') return balance;

    const balanceNanos = parseUnits(balance, fromToken.decimals);
    const reserveNanos = parseUnits(TON_FEE_RESERVE.toString(), fromToken.decimals);
    const reducedNanos = balanceNanos > reserveNanos ? balanceNanos - reserveNanos : 0n;
    return formatUnits(reducedNanos, fromToken.decimals);
};
