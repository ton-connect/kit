/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { formatUnits } from '@demo/wallet-core';

/**
 * Formats a Unix timestamp (in seconds) to a localized date/time string
 * @param timestampSeconds - Unix timestamp in seconds
 * @returns Formatted date/time string
 */
export const formatTimestamp = (timestampSeconds: number): string => {
    return new Date(timestampSeconds * 1000).toLocaleString();
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

/**
 * Formats a TON amount to a localized string with 4 decimal places
 * @param amount - TON amount in nanoTON (1 TON = 10^9 nanoTON)
 * @returns Formatted TON amount string
 */
export const formatDisplayTonAmount = (amount: string): string => {
    const tonAmount = parseFloat(formatUnits(amount, 9)); // Convert nanoTON to TON
    return tonAmount.toFixed(4);
};
