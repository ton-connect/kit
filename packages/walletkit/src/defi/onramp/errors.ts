/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefiError } from '../errors';

export enum OnrampErrorCode {
    /** Provider's upstream API rejected the call. */
    ProviderError = 'PROVIDER_ERROR',
    /** Caller passed parameters that fail provider-level validation. */
    InvalidParams = 'INVALID_ONRAMP_PARAMS',
    /** Provider could not produce a quote for the supplied parameters. */
    QuoteFailed = 'QUOTE_FAILED',
    /** Provider could not build the redirect URL for the requested onramp. */
    UrlBuildFailed = 'URL_BUILD_FAILED',
}

export class OnrampError extends DefiError {
    public readonly code: OnrampErrorCode;

    constructor(message: string, code: OnrampErrorCode, details?: unknown) {
        super(message, code, details);
        this.name = 'OnrampError';
        this.code = code;
    }
}
