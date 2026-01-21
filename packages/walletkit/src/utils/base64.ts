/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Hex, Base64String } from '../api/models';
import { asHex } from './hex';
import { WalletKitError, ERROR_CODES } from '../errors';

export function asBase64(data: string): Base64String {
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(data)) {
        throw new Error('Not a valid base64');
    }

    try {
        // Validate by attempting to decode
        const buffer = Buffer.from(data, 'base64');

        // Check that re-encoding gives the same result (catches invalid padding)
        if (buffer.toString('base64') !== data) {
            throw new Error('Not a valid base64');
        }
    } catch (_e) {
        throw new Error('Not a valid base64');
    }

    return data as Base64String;
}

/**
 * Normalize base64 string
 * @param data Base64 or base64url string
 * @returns Normalized base64 string
 * example: a-_ => a+/
 */
export function Base64Normalize(data: string): string {
    return data.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
}

/**
 * Make base64url string
 * @param data Base64url or base64 string
 * @returns Normalized base64url string
 * example: a+/ => a-_=
 */
export function Base64NormalizeUrl(data: string): string {
    const normalized = Base64Normalize(data);
    const burl = normalized.replace(/-/g, '+').replace(/\//g, '_').replace(/=/g, '');
    return burl;
}

/**
 * Parse base64 string
 * @param data Base64 string
 * @returns utf-8 string
 */
export function ParseBase64(data: string): string {
    if (typeof atob === 'undefined' && typeof Buffer === 'undefined') {
        throw new WalletKitError(ERROR_CODES.CONFIGURATION_ERROR, 'atob function is not available in this environment');
    }
    data = Base64Normalize(data);
    return typeof atob === 'function' ? atob(data) : Buffer.from(data, 'base64').toString('utf-8');
}

/**
 * Convert base64 string to hex
 * @param data Base64 string
 * @returns Hex
 */
export function Base64ToHex(data: string): Hex {
    if (!data) throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Invalid hash: data is required');

    const binary = Base64ToUint8Array(data);
    if (!binary) throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Invalid hash: binary is required');

    // if (binary.length !== 32 && binary.length !== 64) {
    //     throw new WalletKitError(
    //         ERROR_CODES.VALIDATION_ERROR,
    //         'Invalid hex length: expected 32 or 64 bytes',
    //         undefined,
    //         {
    //             actualLength: binary.length,
    //             expectedLength: [32, 64],
    //         },
    //     );
    // }
    return Uint8ArrayToHex(binary);
}

export function Uint8ArrayToHex(data: Iterable<number>): Hex {
    return asHex(
        `0x${[...data]
            .map((b) => {
                if (b < 0 || b > 255)
                    throw new WalletKitError(ERROR_CODES.VALIDATION_ERROR, 'Invalid byte: expected 0-255', undefined, {
                        actualByte: b,
                    });
                return b.toString(16).padStart(2, '0');
            })
            .join('')}`,
    );
}

/**
 * Convert base64 string to uint8 array
 * @param data Base64 string
 * @returns Uint8Array
 */
export function Base64ToUint8Array(data?: string | null): Uint8Array | null {
    if (!data) return null;
    const binary = ParseBase64(data);
    const len = binary.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

/**
 * Convert uint8 array to base64 string
 * @param data Uint8Array
 * @returns Base64 string
 */
export function Uint8ArrayToBase64(data: Uint8Array): string {
    if (typeof btoa === 'undefined' && typeof Buffer === 'undefined') {
        throw new Error('btoa is not available in this environment');
    }
    let binary = '';
    for (let i = 0; i < data.length; i++) {
        binary += String.fromCharCode(data[i]);
    }
    return typeof btoa === 'function' ? btoa(binary) : Buffer.from(data).toString('base64');
}

/**
 * Convert base64 string to bigint
 * @param data Base64 string
 * @returns Bigint
 */
export function Base64ToBigInt(data?: string | null): bigint {
    if (!data || data === '') return 0n;
    const binary = ParseBase64(data);

    const len = binary.length;
    let result = 0n;

    for (let i = 0; i < len; i++) {
        result = (result << 8n) + BigInt(binary.charCodeAt(i));
    }

    return result;
}

/**
 * Convert bigint to base64 string
 * @param data Bigint
 * @returns Base64 string
 */
export function BigIntToBase64(data: bigint): string {
    if (data === 0n) return '';
    const bytes: number[] = [];
    let temp = data;
    while (temp > 0n) {
        bytes.push(Number(temp & 0xffn));
        temp >>= 8n;
    }
    const arr = new Uint8Array(bytes.reverse());
    return Uint8ArrayToBase64(arr);
}

/**
 * Convert uint8 array to bigint
 * @param data Uint8Array
 * @returns Bigint
 */
export function Uint8ArrayToBigInt(data: Uint8Array): bigint {
    let result = 0n;
    for (let i = 0; i < data.length; i++) {
        result = (result << 8n) + BigInt(data[i]);
    }
    return result;
}

export function HexToBigInt(data: Hex): bigint {
    return BigInt(data);
}

/**
 * Convert hash to Uint8Array
 * @param data Hash (hex string starting with 0x)
 * @returns Uint8Array
 */
export function HexToUint8Array(data: Hex): Uint8Array {
    const hex = data.slice(2); // Remove 0x prefix
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}

/**
 * Convert hex to base64 string
 * @param data Hex (hex string starting with 0x)
 * @returns Base64 string
 */
export function HexToBase64(data: Hex): string {
    return Uint8ArrayToBase64(HexToUint8Array(data));
}
