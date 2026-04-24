/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const CURRENCY_DECIMALS: Record<string, number> = {
    TON: 9,
    USDT: 6,
    NOT: 9,
    DOGS: 9,
    HMSTR: 9,
};

export function getCurrencyDecimals(currency: string): number {
    return CURRENCY_DECIMALS[currency.toUpperCase()] ?? 9;
}

export function safeBigInt(value: string): bigint {
    try {
        return BigInt(value);
    } catch {
        return 0n;
    }
}

export function formatAmount(raw: bigint, decimals: number, maxFraction = 4): string {
    if (decimals <= 0) return raw.toString();
    const base = 10n ** BigInt(decimals);
    const whole = raw / base;
    const frac = raw % base;
    const fracStr = frac.toString().padStart(decimals, '0').slice(0, Math.max(0, maxFraction)).replace(/0+$/, '');
    return fracStr ? `${whole}.${fracStr}` : `${whole}`;
}

export function formatPrice(rawAmount: string, currency: string): string {
    const decimals = getCurrencyDecimals(currency);
    return formatAmount(safeBigInt(rawAmount), decimals);
}
