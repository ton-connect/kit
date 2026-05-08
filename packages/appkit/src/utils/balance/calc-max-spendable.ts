/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { formatUnits, parseUnits } from '..';

/**
 * Default TON reserve subtracted from balance when computing the max spendable amount
 * for a native TON operation — leaves room for network fees. 0.1 TON.
 */
export const DEFAULT_TON_FEE_RESERVE_NANOS = 100_000_000n;

export interface CalcMaxSpendableParams {
    /** User's balance of `token`, as a decimal string. */
    balance: string;
    /** The token the user is going to spend. */
    token: { address: string; decimals: number };
    /**
     * TON reserve (in nanos) subtracted from balance when the token is native TON.
     * Ignored for jettons. Defaults to {@link DEFAULT_TON_FEE_RESERVE_NANOS}.
     */
    feeReserveNanos?: bigint;
}

/**
 * Compute the max spendable amount a user can place into an input when they click MAX.
 * For native TON — subtracts a fixed reserve so the user still has room for network fees.
 * For jettons — returns the full balance (gas is paid from TON separately).
 */
export const calcMaxSpendable = ({
    balance,
    token,
    feeReserveNanos = DEFAULT_TON_FEE_RESERVE_NANOS,
}: CalcMaxSpendableParams): string => {
    if (token.address !== 'ton') return balance;

    const balanceNanos = parseUnits(balance, token.decimals);
    const reducedNanos = balanceNanos > feeReserveNanos ? balanceNanos - feeReserveNanos : 0n;
    return formatUnits(reducedNanos, token.decimals);
};
