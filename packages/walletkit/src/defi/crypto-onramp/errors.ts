/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DefiError } from '../errors';

export enum CryptoOnrampErrorCode {
    ProviderError = 'PROVIDER_ERROR',
    QuoteFailed = 'QUOTE_FAILED',
    DepositFailed = 'DEPOSIT_FAILED',
    RefundAddressRequired = 'REFUND_ADDRESS_REQUIRED',
    InvalidRefundAddress = 'INVALID_REFUND_ADDRESS',
    ReversedAmountNotSupported = 'REVERSED_AMOUNT_NOT_SUPPORTED',
    InvalidParams = 'INVALID_PARAMS',
}

export class CryptoOnrampError extends DefiError {
    public readonly code: CryptoOnrampErrorCode;

    constructor(message: string, code: CryptoOnrampErrorCode, details?: unknown) {
        super(message, code, details);
        this.name = 'CryptoOnrampError';
        this.code = code;
    }
}
