/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { KitGlobalOptions } from '../core/KitGlobalOptions';

export function getUnixtime(): number {
    return Math.floor(Date.now() / 1000);
}

export async function isBefore(timestamp1: number, timestamp2?: number): Promise<boolean> {
    const calculated = timestamp2 ?? (await KitGlobalOptions.getCurrentTime());

    return timestamp1 < calculated;
}
