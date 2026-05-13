/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefiError } from '../errors';

export class SwapError extends DefiError {
    /** Provider returned malformed or missing quote data. */
    static readonly INVALID_QUOTE = 'INVALID_QUOTE';
    /** No route or pool has enough liquidity to satisfy the requested swap. */
    static readonly INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY';
    /** Quote payload is too old to use — fetch a new quote before building the transaction. */
    static readonly QUOTE_EXPIRED = 'QUOTE_EXPIRED';
    /** Provider failed to produce a swap transaction from the supplied quote. */
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
