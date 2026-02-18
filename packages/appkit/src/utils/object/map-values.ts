/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export function mapValues<T extends object, K extends keyof T, V>(
    object: T,
    getNewValue: (value: T[K], key: K, obj: T) => V,
): Record<K, V> {
    const result = {} as Record<K, V>;
    const keys = Object.keys(object) as K[];

    for (const key of keys) {
        const value = object[key];

        result[key] = getNewValue(value, key, object);
    }

    return result;
}
