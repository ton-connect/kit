/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefiManagerError } from '../errors';

export class GaslessError extends DefiManagerError {
    static readonly UNSUPPORTED_FEE_JETTON = 'UNSUPPORTED_FEE_JETTON';
    static readonly ESTIMATE_FAILED = 'ESTIMATE_FAILED';
    static readonly SEND_FAILED = 'SEND_FAILED';
    static readonly CONFIG_FAILED = 'CONFIG_FAILED';

    constructor(message: string, code: string, details?: unknown) {
        super(message, code, details);
        this.name = 'GaslessError';
    }
}
