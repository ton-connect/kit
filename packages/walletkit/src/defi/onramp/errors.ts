/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefiError } from '../errors';

export class OnrampError extends DefiError {
    static readonly PROVIDER_ERROR = 'PROVIDER_ERROR';
    static readonly InvalidParams = 'INVALID_ONRAMP_PARAMS';
    static readonly QUOTE_FAILED = 'QUOTE_FAILED';
    static readonly URL_BUILD_FAILED = 'URL_BUILD_FAILED';
    static readonly PAIR_NOT_SUPPORTED = 'PAIR_NOT_SUPPORTED';

    constructor(message: string, code: string, details?: unknown) {
        super(message, code, details);
        this.name = 'OnrampError';
    }
}
