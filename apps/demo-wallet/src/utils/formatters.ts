/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

/**
 * Compare two TON addresses for equality (handles different formats: 0:xxx, EQxxx, UQxxx)
 */
export function sameAddress(a: string, b: string): boolean {
    if (!a || !b) return a === b;
    try {
        return Address.parse(a).equals(Address.parse(b));
    } catch {
        return a === b;
    }
}

/**
 * Formats a Unix timestamp (in seconds) to a localized date/time string
 * @param timestampSeconds - Unix timestamp in seconds
 * @returns Formatted date/time string
 */
export const formatTimestamp = (timestampSeconds: number): string => {
    return new Date(timestampSeconds * 1000).toLocaleString();
};

/**
 * Formats TON amount for consistent display (4 decimals).
 * Accepts amount in nanoton (string) or formatted value like "0.001 TON".
 * TODO - make better function for formatting amounts
 */
export const formatTonForDisplay = (amountOrValue: string): string => {
    const num =
        amountOrValue.includes('TON') || amountOrValue.includes('.')
            ? parseFloat(
                  String(amountOrValue)
                      .replace(/\s*TON\s*$/i, '')
                      .trim(),
              ) || 0
            : parseFloat(amountOrValue || '0') / 1e9;
    return num.toFixed(4);
};

/**
 * Formats a blockchain address to a shortened form (first 6 and last 6 characters)
 * @param addr - Full blockchain address
 * @returns Shortened address (e.g., "EQAbc...xyz123")
 */
export const formatAddress = (addr: string): string => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
};
