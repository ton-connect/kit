/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { RawStackItem } from '../../../api/models';
import type { TonApiTvmStackRecord, TonApiExecGetMethodArg } from '../types/methods';

/**
 * Converts hex BOC string to base64 BOC string.
 * TonApi returns cells in hex format, but ParseStack expects base64.
 */
const hexBocToBase64 = (hex: string): string => {
    return Buffer.from(hex, 'hex').toString('base64');
};

/**
 * Converts a decimal integer string to TonApi int257 hex format (0x... / -0x...).
 */
const decimalToInt257Hex = (value: string): string => {
    const normalized = value.trim();
    if (!/^-?\d+$/.test(normalized)) {
        throw new Error(`Invalid decimal stack number: ${value}`);
    }

    const parsed = BigInt(normalized);
    if (parsed < 0n) {
        return `-0x${(-parsed).toString(16)}`;
    }
    return `0x${parsed.toString(16)}`;
};

/**
 * Maps standard TVM stack items to TonAPI POST execution arguments (`ExecGetMethodArg`).
 *
 * @see {@link https://github.com/tonkeeper/tonapi-js/blob/main/packages/ton-adapter/src/tonapi-adapter.ts#L231}
 * This reference uses string serialization because it targets the GET endpoint (flat query parameters).
 * We use the POST endpoint, which expects explicit JSON objects with strong typing (`cell_boc_base64`, `null` vs `Null`, `nan` vs `NaN`, etc.)
 * according to the openapi specification (https://tonapi.io/api-v2).
 */
export const mapTonApiGetMethodArgs = (stack?: RawStackItem[]): TonApiExecGetMethodArg[] => {
    return (stack || []).map((item) => {
        switch (item.type) {
            case 'null':
                return { type: 'null', value: 'Null' };
            case 'num':
                if (item.value === 'NaN') {
                    return { type: 'nan', value: 'NaN' };
                }
                // TonApi int257 expects 0x-prefixed hex.
                if (item.value.startsWith('0x') || item.value.startsWith('-0x')) {
                    return { type: 'int257', value: item.value };
                }
                // Decimal numbers can exceed tinyint bounds (e.g. uint256 ids), so we always
                // serialize them as int257 in hexadecimal form.
                return { type: 'int257', value: decimalToInt257Hex(item.value) };
            case 'cell':
                // RawStackItem cell value is base64 BOC
                return { type: 'cell_boc_base64', value: item.value };
            case 'slice':
                // RawStackItem slice value is base64 BOC, TonApi expects hex for slice_boc_hex
                return { type: 'slice_boc_hex', value: Buffer.from(item.value, 'base64').toString('hex') };
            case 'builder':
                return { type: 'cell_boc_base64', value: item.value };
            case 'tuple':
            case 'list':
                throw new Error(`TonApi doesn't support ${item.type} in get method arguments`);
            default:
                throw new Error(`Unsupported stack item type: ${(item as { type: string }).type}`);
        }
    });
};

export const mapTonApiTvmStackRecord = (item: TonApiTvmStackRecord): RawStackItem => {
    switch (item.type) {
        case 'null':
            return { type: 'null' };
        case 'nan':
            return { type: 'num', value: 'NaN' };
        case 'num':
            return { type: 'num', value: item.num! };
        case 'cell':
            // TonApi returns cell BOC in hex, ParseStack expects base64
            return { type: 'cell', value: hexBocToBase64(item.cell!) };
        case 'slice':
            // TonApi returns slice BOC in hex, ParseStack expects base64
            return { type: 'slice', value: hexBocToBase64(item.slice || item.cell!) };
        case 'tuple':
            return { type: 'tuple', value: (item.tuple || []).map(mapTonApiTvmStackRecord) };
        default:
            throw new Error(`Unsupported TonApi stack item type: ${item.type}`);
    }
};
