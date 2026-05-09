/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const getCacheKey =
    (prefix: string) =>
    (...params: string[]): string =>
        `${prefix}:${params.join(':')}`;
