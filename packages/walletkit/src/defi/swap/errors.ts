/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefiError } from '../errors';

export enum SwapErrorCode {
    /** Provider returned malformed or missing quote data. */
    InvalidQuote = 'INVALID_QUOTE',
    /** No route or pool has enough liquidity to satisfy the requested swap. */
    InsufficientLiquidity = 'INSUFFICIENT_LIQUIDITY',
    /** Quote payload is too old to use. Fetch a new one before building the transaction. */
    QuoteExpired = 'QUOTE_EXPIRED',
    /** Provider failed to produce a swap transaction from the supplied quote. */
    BuildTxFailed = 'BUILD_TX_FAILED',
    /** Provider rejected the request because of an upstream/network failure. */
    NetworkError = 'NETWORK_ERROR',
}

export class SwapError extends DefiError {
    public readonly code: SwapErrorCode;

    /**
     * @param message - Human-readable description, forwarded to `Error`.
     * @param code - {@link SwapErrorCode} Stable error code for branching logic.
     * @param details - Optional provider-specific context for diagnostics.
     */
    constructor(message: string, code: SwapErrorCode, details?: unknown) {
        super(message, code, details);
        this.name = 'SwapError';
        this.code = code;
    }
}
