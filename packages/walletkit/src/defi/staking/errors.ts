/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefiManagerError } from '../errors';

export class StakingError extends DefiManagerError {
    static readonly INVALID_QUOTE = 'INVALID_QUOTE'; // TODO rewrite
    static readonly INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY'; // TODO rewrite
    static readonly QUOTE_EXPIRED = 'QUOTE_EXPIRED'; // TODO rewrite

    constructor(message: string, code: string, details?: unknown) {
        super(message, code, details);
        this.name = 'StakingError';
    }
}
