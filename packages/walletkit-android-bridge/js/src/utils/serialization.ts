/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * JSON replacer that converts BigInt values to strings to avoid serialization errors.
 */
export function bigIntReplacer(_key: string, value: unknown): unknown {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
}
