import { ERROR_CODES, type ErrorCode, getErrorCodeName } from './codes';

/**
 * Generic error class for WalletKit that wraps standard Error with error codes
 */
export class WalletKitError extends Error {
    public readonly code: ErrorCode;
    public readonly codeName: string;
    public readonly originalError?: Error;
    public readonly context?: Record<string, unknown>;

    constructor(code: ErrorCode, message: string, originalError?: Error, context?: Record<string, unknown>) {
        // If originalError is provided, include its message
        const fullMessage = originalError ? `${message}: ${originalError.message}` : message;

        super(fullMessage);

        this.name = 'WalletKitError';
        this.code = code;
        this.codeName = getErrorCodeName(code);
        this.originalError = originalError;
        this.context = context;

        // Maintain proper stack trace (Node.js)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, WalletKitError);
        }

        // If we have an original error, preserve its stack trace
        if (originalError?.stack) {
            this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
        }
    }

    /**
     * Create a WalletKitError from an unknown error
     */
    static fromError(
        code: ErrorCode,
        message: string,
        error: unknown,
        context?: Record<string, unknown>,
    ): WalletKitError {
        if (error instanceof Error) {
            return new WalletKitError(code, message, error, context);
        }

        // Handle non-Error objects
        const errorMessage =
            error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error);

        return new WalletKitError(code, `${message}: ${errorMessage}`, undefined, { ...context, originalValue: error });
    }

    /**
     * Check if an error is a WalletKitError with a specific code
     */
    static isWalletKitError(error: unknown, code?: ErrorCode): error is WalletKitError {
        if (!(error instanceof WalletKitError)) {
            return false;
        }

        if (code !== undefined) {
            return error.code === code;
        }

        return true;
    }

    /**
     * Serialize error to JSON
     */
    toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            codeName: this.codeName,
            context: this.context,
            stack: this.stack,
            originalError: this.originalError
                ? {
                      name: this.originalError.name,
                      message: this.originalError.message,
                      stack: this.originalError.stack,
                  }
                : undefined,
        };
    }
}

// Convenience factory functions for common error types
export class BridgeError extends WalletKitError {
    constructor(message: string, originalError?: Error, context?: Record<string, unknown>) {
        super(ERROR_CODES.BRIDGE_NOT_INITIALIZED, message, originalError, context);
        this.name = 'BridgeError';
    }
}

export class SessionError extends WalletKitError {
    constructor(message: string, originalError?: Error, context?: Record<string, unknown>) {
        super(ERROR_CODES.SESSION_NOT_FOUND, message, originalError, context);
        this.name = 'SessionError';
    }
}

export class EventStoreError extends WalletKitError {
    constructor(message: string, originalError?: Error, context?: Record<string, unknown>) {
        super(ERROR_CODES.EVENT_STORE_NOT_INITIALIZED, message, originalError, context);
        this.name = 'EventStoreError';
    }
}

export class StorageError extends WalletKitError {
    constructor(message: string, originalError?: Error, context?: Record<string, unknown>) {
        super(ERROR_CODES.STORAGE_READ_FAILED, message, originalError, context);
        this.name = 'StorageError';
    }
}
