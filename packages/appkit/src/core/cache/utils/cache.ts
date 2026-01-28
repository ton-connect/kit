/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CacheKey } from '../types/common';

export const getCacheKey = (cacheKey: CacheKey): string => {
    if (Array.isArray(cacheKey)) {
        return cacheKey.join('-');
    }
    return String(cacheKey);
};

export const createTimeCacheKey = (cacheKey: string) => `${cacheKey}__swr_time__`;
