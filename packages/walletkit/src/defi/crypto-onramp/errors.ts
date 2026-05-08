/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefiError } from '../errors';

export class CryptoOnrampError extends DefiError {
    static readonly PROVIDER_ERROR = 'PROVIDER_ERROR';
    static readonly QUOTE_FAILED = 'QUOTE_FAILED';
    static readonly DEPOSIT_FAILED = 'DEPOSIT_FAILED';
    static readonly REFUND_ADDRESS_REQUIRED = 'REFUND_ADDRESS_REQUIRED';
    static readonly INVALID_REFUND_ADDRESS = 'INVALID_REFUND_ADDRESS';
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
