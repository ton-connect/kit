/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

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

export function asTONHex(value: string): TONHex {
    if (!HEX_PATTERN.test(value) || value.replace(/^0x/i, '').length % 2 !== 0) {
        throw new TypeError(`Not a valid hex string: ${value}`);
    }
    return value as TONHex;
}

export function asTONBase64(value: string): TONBase64 {
    if (!BASE64_PATTERN.test(value) && !BASE64URL_PATTERN.test(value)) {
        throw new TypeError(`Not a valid base64 string: ${value}`);
    }
    return value as TONBase64;
}

export function asTONUserFriendlyAddress(value: string): TONUserFriendlyAddress {
    if (value.length !== 48 || !BASE64URL_PATTERN.test(value)) {
        throw new TypeError(`Not a valid user-friendly TON address: ${value}`);
    }
    return value as TONUserFriendlyAddress;
}

export function asTONRawAddress(value: string): TONRawAddress {
    if (!RAW_ADDRESS_PATTERN.test(value)) {
        throw new TypeError(`Not a valid raw TON address: ${value}`);
    }
    return value as TONRawAddress;
}

export function unbrand(value: TONHex | TONBase64 | TONUserFriendlyAddress | TONRawAddress): string {
    return value;
}
