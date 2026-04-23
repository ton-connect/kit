/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { formatUnits, parseUnits } from '@ton/appkit';

/** Extra TON buffer added on top of built transaction outflow when checking balance before sending. */
export const TON_GAS_BUFFER_NANOS = 100_000_000n;

/**
 * Extra headroom (in TON) baked into the suggested reduced amount on top of the gas buffer.
 * Covers quote/gas drift between the current built tx and the one that will actually be sent
 * after the amount changes.
 */
const SUGGESTED_AMOUNT_SAFETY_MARGIN_TON = 0.02;

export type BalanceShortfall =
    | { mode: 'reduce'; requiredNanos: bigint; suggestedFromAmount: string }
    | { mode: 'topup'; requiredNanos: bigint; suggestedFromAmount: '' };

/**
 * Check whether the user's TON balance covers the built swap transaction.
 * - Returns `null` if balance is sufficient.
 * - Returns `{ mode: 'reduce', ... }` with a smaller suggested fromAmount when fromToken is TON
 *   and the balance is enough to cover at least gas (user can fix it by reducing the amount).
 * - Returns `{ mode: 'topup', ... }` when fromToken is a jetton (reducing jetton amount won't free up TON gas),
 *   or when fromToken is TON but the balance can't even cover gas (reducing won't help — user must top up).
 */
export const analyzeBalanceShortfall = ({
    messages,
    tonBalance,
    fromToken,
    fromAmount,
}: {
    messages: Array<{ amount: string }>;
    tonBalance: string | undefined;
    fromToken: { address: string };
    fromAmount: string;
}): BalanceShortfall | null => {
    const totalOutNanos = messages.reduce((acc, m) => acc + BigInt(m.amount), 0n);
    const requiredNanos = totalOutNanos + TON_GAS_BUFFER_NANOS;
    const tonBalanceNanos = tonBalance ? parseUnits(tonBalance, 9) : 0n;

    if (tonBalanceNanos >= requiredNanos) return null;

    if (fromToken.address === 'ton') {
        const safetyMarginNanos = parseUnits(SUGGESTED_AMOUNT_SAFETY_MARGIN_TON.toString(), 9);
        const gasOnlyNanos = totalOutNanos - parseUnits(fromAmount, 9);
        const nonSwapReservedNanos = gasOnlyNanos + TON_GAS_BUFFER_NANOS + safetyMarginNanos;

        // Balance can't cover even gas for a minimal swap — reducing the amount won't help.
        if (tonBalanceNanos <= nonSwapReservedNanos) {
            return { mode: 'topup', requiredNanos, suggestedFromAmount: '' };
        }

        const suggestedFromAmount = formatUnits(tonBalanceNanos - nonSwapReservedNanos, 9);
        return { mode: 'reduce', requiredNanos, suggestedFromAmount };
    }

    return { mode: 'topup', requiredNanos, suggestedFromAmount: '' };
};
