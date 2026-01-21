/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import deepmerge from 'deepmerge';
import type { DeepPartial } from 'src/app/utils/types';
import { isPlainObject } from 'is-plain-object';

export function mergeOptions<T>(options: DeepPartial<T> | undefined | null, defaultOptions: T): T {
    if (!options) {
        return defaultOptions;
    }

    const overwriteMerge = (_: unknown[], sourceArray: unknown[], __: unknown): unknown[] => sourceArray;

    return deepmerge(defaultOptions, options, {
        arrayMerge: overwriteMerge,
        isMergeableObject: isPlainObject,
    });
}
