/**
 * Error codes for WalletKit
 * Range: 7000-7999
 */

export const ERROR_CODES = {
    // Bridge Manager Errors (7000-7099)
    BRIDGE_NOT_INITIALIZED: 7000,
    BRIDGE_CONNECTION_FAILED: 7001,
    BRIDGE_EVENT_PROCESSING_FAILED: 7002,
    BRIDGE_RESPONSE_SEND_FAILED: 7003,

    // Session Errors (7100-7199)
    SESSION_NOT_FOUND: 7100,
    SESSION_ID_REQUIRED: 7101,
    SESSION_CREATION_FAILED: 7102,

    // Event Store Errors (7200-7299)
    EVENT_STORE_NOT_INITIALIZED: 7200,
    EVENT_STORE_OPERATION_FAILED: 7201,

    // Storage Errors (7300-7399)
    STORAGE_READ_FAILED: 7300,
    STORAGE_WRITE_FAILED: 7301,

    // Generic Errors (7900-7999)
    UNKNOWN_ERROR: 7900,
    VALIDATION_ERROR: 7901,
    INITIALIZATION_ERROR: 7902,
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Get error code name by value
 */
export function getErrorCodeName(code: ErrorCode): string {
    const entry = Object.entries(ERROR_CODES).find(([, value]) => value === code);
    return entry ? entry[0] : `UNKNOWN_CODE_${code}`;
}
