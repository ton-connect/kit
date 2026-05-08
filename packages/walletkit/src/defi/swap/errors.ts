/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefiError } from '../errors';

export class SwapError extends DefiError {
    static readonly INVALID_QUOTE = 'INVALID_QUOTE';
    static readonly INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY';
    static readonly QUOTE_EXPIRED = 'QUOTE_EXPIRED';
    static readonly BUILD_TX_FAILED = 'BUILD_TX_FAILED';

    /**
     * @param message - Human-readable description, forwarded to `Error`.
     * @param code - Stable error code from the static `SwapError.*` / `DefiError.*` constants.
     * @param details - Optional provider-specific context for diagnostics.
     */
    constructor(message: string, code: string, details?: unknown) {
        super(message, code, details);
        this.name = 'SwapError';
    }
}
