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
