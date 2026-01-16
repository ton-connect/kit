/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Swap API interface exposed by SwapManager
 */
export interface DefiManagerAPI<T> {
    registerProvider(name: string, provider: T): void;
    setDefaultProvider(name: string): void;
    getProvider(name?: string): T;
    getRegisteredProviders(): string[];
    hasProvider(name: string): boolean;
}
