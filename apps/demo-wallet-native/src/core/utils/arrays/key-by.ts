/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export function keyBy<T, K extends PropertyKey>(arr: readonly T[], getKeyFromItem: (item: T) => K): Record<K, T> {
    const result = {} as Record<K, T>;

    arr.forEach((item) => {
        const key = getKeyFromItem(item);
        result[key] = item;
    });

    return result;
}
