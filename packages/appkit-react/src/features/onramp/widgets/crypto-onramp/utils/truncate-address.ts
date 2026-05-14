/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const SHORT_ADDRESS_THRESHOLD = 20;
const HEAD_LENGTH = 10;
const TAIL_LENGTH = 8;

/**
 * Shorten a deposit address for display, keeping the first {@link HEAD_LENGTH} and last
 * {@link TAIL_LENGTH} characters separated by an ellipsis. Addresses shorter than
 * {@link SHORT_ADDRESS_THRESHOLD} are returned unchanged.
 */
export const truncateAddress = (address: string): string => {
    if (address.length <= SHORT_ADDRESS_THRESHOLD) return address;
    return `${address.slice(0, HEAD_LENGTH)}...${address.slice(-TAIL_LENGTH)}`;
};
