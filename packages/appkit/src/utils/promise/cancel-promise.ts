/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const cancelPromise = <T>(promise: T, timeoutMs: number): Promise<T> => {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Execution timed out - ${timeoutMs}ms`)), timeoutMs);
        }) as T,
    ]);
};
