/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const isNumber = (value: unknown): value is number => {
    if (typeof value !== 'number') {
        return false;
    }

    if (Number.isNaN(value)) {
        return false;
    }

    return Number.isFinite(value);
};
