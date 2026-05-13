/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefiError } from '../errors';

export class CryptoOnrampError extends DefiError {
    /** Provider's upstream API rejected the call (unexpected response, auth failure, internal error). */
    static readonly PROVIDER_ERROR = 'PROVIDER_ERROR';
    /** Provider could not produce a quote for the supplied parameters. */
    static readonly QUOTE_FAILED = 'QUOTE_FAILED';
    /** Provider could not create a deposit for the previously obtained quote. */
    static readonly DEPOSIT_FAILED = 'DEPOSIT_FAILED';
    /** Provider requires a refund address that the caller did not supply. */
    static readonly REFUND_ADDRESS_REQUIRED = 'REFUND_ADDRESS_REQUIRED';
    /** Supplied refund address is not valid for the source chain. */
    static readonly INVALID_REFUND_ADDRESS = 'INVALID_REFUND_ADDRESS';
    /** Provider does not support specifying the amount on the target side of the swap. */
    static readonly REVERSED_AMOUNT_NOT_SUPPORTED = 'REVERSED_AMOUNT_NOT_SUPPORTED';

    /**
     * @param message - Human-readable description, forwarded to `Error`.
     * @param code - Stable error code from the static `CryptoOnrampError.*` / `DefiError.*` constants.
     * @param details - Optional provider-specific context for diagnostics.
     */
    constructor(message: string, code: string, details?: unknown) {
        super(message, code, details);
        this.name = 'CryptoOnrampError';
    }
}
