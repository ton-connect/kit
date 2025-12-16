/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ErrorInfo } from './WalletKitError';
import type { ErrorCode } from './codes';
import { ERROR_MESSAGES } from './messages';

export function createErrorInfo(code: ErrorCode, message?: string, data?: Record<string, unknown>): ErrorInfo {
    return {
        code,
        message: message || ERROR_MESSAGES[code] || 'Unknown error',
        data,
    };
}
