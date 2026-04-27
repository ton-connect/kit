/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Tool response type - must be compatible with MCP SDK's expected return type
export interface ToolResponse {
    [key: string]: unknown;
    content: Array<{ type: 'text'; text: string }>;
    isError?: boolean;
}

export interface StructuredToolError {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
}

// Always emit a structured error envelope so callers don't have to type-test the field.
export function toStructuredError(result: {
    message: string;
    errorCode?: string;
    errorDetails?: Record<string, unknown>;
}): StructuredToolError {
    const out: StructuredToolError = { message: result.message };
    if (result.errorCode) out.code = result.errorCode;
    if (result.errorDetails) out.details = result.errorDetails;
    return out;
}

/**
 * Converts a human-readable amount to raw units.
 */
export function toRawAmount(amount: string, decimals: number): string {
    const [intPart, fracPart = ''] = amount.split('.');
    const paddedFrac = fracPart.padEnd(decimals, '0').slice(0, decimals);
    const raw = (intPart + paddedFrac).replace(/^0+/, '') || '0';
    return raw;
}

export const TON_DECIMALS = 9;
