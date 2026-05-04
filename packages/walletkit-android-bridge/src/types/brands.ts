/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Branded string types for the wrapper domain types that cross the bridge.
// Wire format stays a plain string — these brands exist only at compile time so TS code
// can't accidentally mix a TONHex with an arbitrary string. Mirrors the distinction the
// Kotlin `data class TONHex(val value: String)` already enforces on its side.

declare const tonHexBrand: unique symbol;
declare const tonBase64Brand: unique symbol;
declare const tonUserFriendlyAddressBrand: unique symbol;
declare const tonRawAddressBrand: unique symbol;

export type TONHex = string & { readonly [tonHexBrand]: true };
export type TONBase64 = string & { readonly [tonBase64Brand]: true };
export type TONUserFriendlyAddress = string & { readonly [tonUserFriendlyAddressBrand]: true };
export type TONRawAddress = string & { readonly [tonRawAddressBrand]: true };

const HEX_PATTERN = /^(?:0x|0X)?[0-9a-fA-F]+$/;
const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]*={0,2}$/;
const RAW_ADDRESS_PATTERN = /^-?\d+:[0-9a-fA-F]{64}$/;

/** Asserts and brands `value` as TONHex. Throws if it isn't a valid hex string. */
export function asTONHex(value: string): TONHex {
    if (!HEX_PATTERN.test(value) || value.replace(/^0x/i, '').length % 2 !== 0) {
        throw new TypeError(`Not a valid hex string: ${value}`);
    }
    return value as TONHex;
}

/** Asserts and brands `value` as TONBase64. Accepts both standard and base64url. */
export function asTONBase64(value: string): TONBase64 {
    if (!BASE64_PATTERN.test(value) && !BASE64URL_PATTERN.test(value)) {
        throw new TypeError(`Not a valid base64 string: ${value}`);
    }
    return value as TONBase64;
}

/**
 * Asserts and brands `value` as TONUserFriendlyAddress. Performs only a length check
 * (48 characters, base64url alphabet) — full TON address validation is the SDK's job.
 */
export function asTONUserFriendlyAddress(value: string): TONUserFriendlyAddress {
    if (value.length !== 48 || !BASE64URL_PATTERN.test(value)) {
        throw new TypeError(`Not a valid user-friendly TON address: ${value}`);
    }
    return value as TONUserFriendlyAddress;
}

/** Asserts and brands `value` as TONRawAddress (`workchain:hash`). */
export function asTONRawAddress(value: string): TONRawAddress {
    if (!RAW_ADDRESS_PATTERN.test(value)) {
        throw new TypeError(`Not a valid raw TON address: ${value}`);
    }
    return value as TONRawAddress;
}

/** Strips the brand. Useful at the bridge boundary where the wire format is plain string. */
export function unbrand(value: TONHex | TONBase64 | TONUserFriendlyAddress | TONRawAddress): string {
    return value;
}
