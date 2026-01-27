/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SWROptions } from 'swrev';
import { SWR } from 'swrev';

export class CacheClient extends SWR {
    constructor(options?: Partial<SWROptions>) {
        super({
            ...options,
            fetcher: async () => {
                throw new Error('Default fetcher disabled. Provide a watcherFn.');
            },
        });
    }
}
