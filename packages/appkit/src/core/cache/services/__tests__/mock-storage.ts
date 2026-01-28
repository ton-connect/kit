/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ResponseEnvelope, Storage } from '../types/cache';

export const mockedLocalStorage: Storage & { clear: () => void } = (function () {
    const store = new Map<string, string>();

    return {
        clear() {
            store.clear();
        },
        getItem(key: string) {
            return store.has(key) ? store.get(key) : null;
        },
        removeItem(key: string) {
            return store.delete(key);
        },
        setItem(key: string, value: unknown) {
            store.set(key, String(value));
        },
    };
})();

export const valueFromEnvelope = <Value>(envelope: ResponseEnvelope<Value>): Value => envelope.value;
