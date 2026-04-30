/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface AppKitCache {
    get<T = unknown>(key: string): T | undefined | Promise<T | undefined>;
    set(key: string, value: unknown): void | Promise<void>;
    remove(key: string): void | Promise<void>;
    clear(): void | Promise<void>;
}
