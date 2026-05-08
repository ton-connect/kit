/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefiError } from '../errors';

export enum StakingErrorCode {
    /** Caller passed parameters that fail provider-level validation. */
    InvalidParams = 'INVALID_PARAMS',
    /** Provider doesn't support the requested operation (e.g., reversed quote on a unidirectional pool). */
    UnsupportedOperation = 'UNSUPPORTED_OPERATION',
}

export class StakingError extends DefiError {
    public readonly code: StakingErrorCode;

    /**
     * @param message - Human-readable description, forwarded to `Error`.
     * @param code - Stable {@link StakingErrorCode} for branching logic.
     * @param details - Optional provider-specific context for diagnostics.
     */
    constructor(message: string, code: StakingErrorCode, details?: unknown) {
        super(message, code, details);
        this.name = 'StakingError';
        this.code = code;
    }
}
