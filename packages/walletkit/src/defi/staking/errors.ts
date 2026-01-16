/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefiManagerError } from '../errors';

export enum StakingErrorCode {
    InvalidParams = 'INVALID_PARAMS',
    UnsupportedOperation = 'UNSUPPORTED_OPERATION',
}

export class StakingError extends DefiManagerError {
    public readonly code: StakingErrorCode;

    constructor(message: string, code: StakingErrorCode, details?: unknown) {
        super(message, code, details);
        this.name = 'StakingError';
        this.code = code;
    }
}
