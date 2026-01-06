/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getUnixtime } from '../utils';

type GetCurrentTimeFunc = () => Promise<number> | number;

export class KitGlobalOptions {
    private static getCurrentTimeImpl: GetCurrentTimeFunc = getUnixtime;

    static setGetCurrentTime(fn: GetCurrentTimeFunc): void {
        KitGlobalOptions.getCurrentTimeImpl = fn;
    }

    static async getCurrentTime(): Promise<number> {
        return KitGlobalOptions.getCurrentTimeImpl();
    }
}
