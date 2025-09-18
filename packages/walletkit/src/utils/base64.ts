import { Hash, asHash } from '../types/primitive';

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
 * Parse base64 string
 * @param data Base64 string
 * @returns utf-8 string
 */
export function ParseBase64(data: string): string {
    if (typeof atob === 'undefined') {
        throw new Error('atob is not available in this environment');
    }
    data = Base64Normalize(data);
    return atob(data);
}

/**
 * Convert base64 string to hash
 * @param data Base64 string
 * @returns Hash
 */
export function Base64ToHash(data?: string | null): Hash | null {
    const binary = Base64ToUint8Array(data);
    if (!binary) return null;

    if (binary.length !== 32) {
        throw new Error('Not a valid 32-byte hash');
    }

    const hex = [...binary].map((b) => b.toString(16).padStart(2, '0')).join('');

    return asHash(`0x${hex}`);
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
    if (typeof btoa === 'undefined') {
        throw new Error('btoa is not available in this environment');
    }
    let binary = '';
    for (let i = 0; i < data.length; i++) {
        binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
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
