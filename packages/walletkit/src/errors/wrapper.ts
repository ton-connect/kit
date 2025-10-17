import { ErrorInfo } from './WalletKitError';
import { ErrorCode } from './codes';
import { ERROR_MESSAGES } from './messages';

export function createErrorInfo(code: ErrorCode, message?: string, data?: Record<string, unknown>): ErrorInfo {
    return {
        code,
        message: message || ERROR_MESSAGES[code] || 'Unknown error',
        data,
    };
}
