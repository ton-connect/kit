/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export function truncateDecimals(value: string, maxDecimals: number): string {
    const dotIndex = value.indexOf('.');
    if (dotIndex === -1) return value;
    return value.slice(0, dotIndex + 1 + maxDecimals);
}
