/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Serialization helpers shared across the WalletKit Android bridge.
 */

/**
 * JSON replacer that converts BigInt values to strings to avoid serialization errors.
 */
export function bigIntReplacer(_key: string, value: unknown): unknown {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
}

/**
 * Normalizes a hex string by ensuring the `0x` prefix is present.
 * Throws when the input is empty.
 */
export function normalizeHex(hex: string): string {
    const trimmed = typeof hex === 'string' ? hex.trim() : '';
    if (!trimmed) {
        throw new Error('Empty hex string');
    }
    return trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
}

/**
 * Converts a normalized hex string into a byte array.
 */
export function hexToBytes(hex: string): Uint8Array {
    const normalized = normalizeHex(hex).slice(2);
    if (normalized.length % 2 !== 0) {
        throw new Error(`Invalid hex string length: ${normalized.length}`);
    }
    const bytes = new Uint8Array(normalized.length / 2);
    for (let i = 0; i < normalized.length; i += 2) {
        bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
    }
    return bytes;
}

/**
 * Converts a byte array into a hex string prefixed with `0x`.
 */
export function bytesToHex(bytes: Uint8Array): string {
    let hex = '0x';
    for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
}

/**
 * Converts an arbitrary value into an ISO date string, when possible.
 */
export function serializeDate(value: unknown): string | null {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    const timestamp = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(timestamp)) return null;
    return new Date(timestamp).toISOString();
}
