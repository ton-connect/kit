/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

type Fn = (...args: unknown[]) => unknown;

export const isFunction = (value: unknown): value is Fn => typeof value === 'function';

export const isNullOrUndefined = (value: unknown): value is null | undefined =>
    typeof value === 'undefined' || value === null;

export const isPlainObject = (value: unknown) => !!value && typeof value === 'object' && !Array.isArray(value);
