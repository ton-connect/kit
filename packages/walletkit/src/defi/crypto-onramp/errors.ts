/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefiError } from '../errors';

export enum CryptoOnrampErrorCode {
    /** Provider's upstream API rejected the call (unexpected response, auth failure, internal error). */
    ProviderError = 'PROVIDER_ERROR',
    /** Provider could not produce a quote for the supplied parameters. */
    QuoteFailed = 'QUOTE_FAILED',
    /** Provider could not create a deposit for the previously obtained quote. */
    DepositFailed = 'DEPOSIT_FAILED',
    /** Provider requires a refund address that the caller did not supply. */
    RefundAddressRequired = 'REFUND_ADDRESS_REQUIRED',
    /** Supplied refund address is not valid for the source chain. */
    InvalidRefundAddress = 'INVALID_REFUND_ADDRESS',
    /** Provider does not support specifying the amount on the target side of the swap. */
    ReversedAmountNotSupported = 'REVERSED_AMOUNT_NOT_SUPPORTED',
    /** Caller passed parameters that fail provider-level validation. */
    InvalidParams = 'INVALID_PARAMS',
}

export class CryptoOnrampError extends DefiError {
    public readonly code: CryptoOnrampErrorCode;

    /**
     * @param message - Human-readable description, forwarded to `Error`.
     * @param code - {@link CryptoOnrampErrorCode} Stable error code for branching logic.
     * @param details - Optional provider-specific context for diagnostics.
     */
    constructor(message: string, code: CryptoOnrampErrorCode, details?: unknown) {
        super(message, code, details);
        this.name = 'CryptoOnrampError';
        this.code = code;
    }
}
