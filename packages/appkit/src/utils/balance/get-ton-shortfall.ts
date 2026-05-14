/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { formatUnits, parseUnits } from '..';

/** Default extra TON buffer added on top of built transaction outflow when checking balance before sending. */
export const DEFAULT_GAS_BUFFER_NANOS = 100_000_000n;

/**
 * Default extra headroom baked into the suggested reduced amount, on top of the gas buffer.
 * Covers quote/gas drift between the current built tx and the one that will actually be sent
 * after the amount changes. 0.02 TON.
 */
export const DEFAULT_SAFETY_MARGIN_NANOS = 20_000_000n;

export type TonShortfall =
    | { mode: 'reduce'; requiredNanos: bigint; suggestedFromAmount: string }
    | { mode: 'topup'; requiredNanos: bigint; suggestedFromAmount: '' };

export interface GetTonShortfallParams {
    /** Messages of the built transaction. Each `amount` is the TON value in nanos attached to the message. */
    messages: Array<{ amount: string }>;
    /** User's current TON balance as a decimal string (same format `formatUnits(balance, 9)` returns). */
    tonBalance: string | undefined;
    /** The outgoing token — `{ address: 'ton' }` when the user spends TON, otherwise a jetton. */
    fromToken: { address: string };
    /** Amount the user intends to spend in `fromToken` units, as a decimal string. */
    fromAmount: string;
    /**
     * Extra TON headroom on top of built-tx outflow when checking balance before sending.
     * Defaults to {@link DEFAULT_GAS_BUFFER_NANOS}.
     */
    gasBufferNanos?: bigint;
    /**
     * Extra headroom baked into the suggested reduced amount, on top of the gas buffer.
     * Defaults to {@link DEFAULT_SAFETY_MARGIN_NANOS}.
     */
    safetyMarginNanos?: bigint;
}

/**
 * Check whether the user's TON balance covers the built transaction.
 * - Returns `undefined` if the balance is sufficient.
 * - Returns `{ mode: 'reduce', ... }` with a smaller suggested `fromAmount` when `fromToken` is TON
 *   and the balance is enough to cover at least gas (user can fix it by reducing the amount).
 * - Returns `{ mode: 'topup', ... }` when `fromToken` is a jetton (reducing jetton amount won't free up TON gas),
 *   or when `fromToken` is TON but the balance can't even cover gas (reducing won't help — user must top up).
 */
export const getTonShortfall = ({
    messages,
    tonBalance,
    fromToken,
    fromAmount,
    gasBufferNanos = DEFAULT_GAS_BUFFER_NANOS,
    safetyMarginNanos = DEFAULT_SAFETY_MARGIN_NANOS,
}: GetTonShortfallParams): TonShortfall | undefined => {
    const totalOutNanos = messages.reduce((acc, m) => acc + BigInt(m.amount), 0n);
    const requiredNanos = totalOutNanos + gasBufferNanos;
    const tonBalanceNanos = tonBalance ? parseUnits(tonBalance, 9) : 0n;

    if (tonBalanceNanos >= requiredNanos) return;

    if (fromToken.address === 'ton') {
        const gasOnlyNanos = totalOutNanos - parseUnits(fromAmount, 9);
        const nonSwapReservedNanos = gasOnlyNanos + gasBufferNanos + safetyMarginNanos;

        // Balance can't cover even gas for a minimal outgoing tx — reducing the amount won't help.
        if (tonBalanceNanos <= nonSwapReservedNanos) {
            return { mode: 'topup', requiredNanos, suggestedFromAmount: '' };
        }

        const suggestedFromAmount = formatUnits(tonBalanceNanos - nonSwapReservedNanos, 9);
        return { mode: 'reduce', requiredNanos, suggestedFromAmount };
    }

    return { mode: 'topup', requiredNanos, suggestedFromAmount: '' };
};
