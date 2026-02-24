/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const middleEllipsis = (value: string, left = 5, right = 5) => {
    if (value.length <= left + right) {
        return value;
    }

    return `${value.slice(0, left)}...${value.slice(-right)}`;
};
