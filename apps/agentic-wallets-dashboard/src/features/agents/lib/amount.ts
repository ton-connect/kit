/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { formatUnits, parseUnits } from '@ton/walletkit';

function normalizeUiAmountInput(input: string): string | null {
    const trimmed = input.trim();
    if (!trimmed) {
        return null;
    }

    const withLeadingZero = trimmed.startsWith('.') ? `0${trimmed}` : trimmed;
    const normalized = withLeadingZero.endsWith('.') ? withLeadingZero.slice(0, -1) : withLeadingZero;
    if (!normalized) {
        return null;
    }

    return /^\d+(\.\d+)?$/.test(normalized) ? normalized : null;
}

export function tryParseUiAmountToUnits(input: string, decimals: number): bigint | null {
    const normalized = normalizeUiAmountInput(input);
    if (!normalized) {
        return null;
    }

    try {
        return parseUnits(normalized, decimals);
    } catch {
        return null;
    }
}

export function parseUiAmountToUnits(input: string, decimals: number, fieldName: string): bigint {
    const parsed = tryParseUiAmountToUnits(input, decimals);
    if (parsed === null) {
        throw new Error(`${fieldName} must be a valid number`);
    }
    return parsed;
}

export function formatUnitsTrimmed(units: bigint, decimals: number): string {
    const raw = formatUnits(units.toString(), decimals);
    if (!raw.includes('.')) {
        return raw;
    }
    return raw.replace(/\.?0+$/, '');
}

export function formatUiAmountFixed(input: string, fractionDigits: number): string {
    const normalized = normalizeUiAmountInput(input);
    if (!normalized) {
        return '0';
    }

    const [wholeRaw, fractionRaw = ''] = normalized.split('.');
    const whole = wholeRaw.replace(/^0+(?=\d)/, '');
    const fraction = fractionRaw.padEnd(fractionDigits, '0').slice(0, fractionDigits);
    return fractionDigits > 0 ? `${whole || '0'}.${fraction}` : whole || '0';
}
