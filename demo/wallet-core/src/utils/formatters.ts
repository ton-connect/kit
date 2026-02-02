/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

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
 * @param count - Number of characters to show from the start and end of the address
 * @returns Shortened address (e.g., "EQAbc...xyz123")
 */
export const formatAddress = (addr: string, count = 6): string => {
    if (!addr) return '';

    return `${addr.slice(0, count)}...${addr.slice(-count)}`;
};
