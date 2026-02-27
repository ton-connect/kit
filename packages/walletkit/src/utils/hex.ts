/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Hex } from '../api/models';

export function asHex(data: string): Hex {
    if (!isHex(data)) {
        throw new Error('Not a valid hex');
    }

    return data as Hex;
}

export function isHex(data: string): boolean {
    return /^0x[0-9a-fA-F]+$/.test(data) && data.length % 2 === 0;
}
