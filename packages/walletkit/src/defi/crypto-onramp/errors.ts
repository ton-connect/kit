/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefiManagerError } from '../errors';

export class CryptoOnrampError extends DefiManagerError {
    static readonly PROVIDER_ERROR = 'PROVIDER_ERROR';
    static readonly InvalidParams = 'INVALID_CRYPTO_ONRAMP_PARAMS';
    static readonly QUOTE_FAILED = 'QUOTE_FAILED';
    static readonly DEPOSIT_FAILED = 'DEPOSIT_FAILED';

    constructor(message: string, code: string, details?: unknown) {
        super(message, code, details);
        this.name = 'CryptoOnrampError';
    }
}
