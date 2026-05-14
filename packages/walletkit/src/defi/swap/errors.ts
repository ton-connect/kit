/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefiError } from '../errors';

export enum SwapErrorCode {
    InvalidQuote = 'INVALID_QUOTE',
    InsufficientLiquidity = 'INSUFFICIENT_LIQUIDITY',
    QuoteExpired = 'QUOTE_EXPIRED',
    BuildTxFailed = 'BUILD_TX_FAILED',
    NetworkError = 'NETWORK_ERROR',
}

export class SwapError extends DefiError {
    public readonly code: SwapErrorCode;

    constructor(message: string, code: SwapErrorCode, details?: unknown) {
        super(message, code, details);
        this.name = 'SwapError';
        this.code = code;
    }
}
