/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefiManagerError } from '../errors';

export class SwapError extends DefiManagerError {
    static readonly INVALID_QUOTE = 'INVALID_QUOTE';
    static readonly INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY';
    static readonly QUOTE_EXPIRED = 'QUOTE_EXPIRED';
    static readonly BUILD_TX_FAILED = 'BUILD_TX_FAILED';

    constructor(message: string, code: string, details?: unknown) {
        super(message, code, details);
        this.name = 'SwapError';
    }
}
