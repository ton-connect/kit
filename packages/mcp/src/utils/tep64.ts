/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createHash } from 'node:crypto';

import { Dictionary } from '@ton/core';
import type { Cell } from '@ton/core';

/** TEP-64 content-layout prefix: 0x00 = onchain dictionary, 0x01 = offchain URI. */
const ONCHAIN_CONTENT_PREFIX = 0x00;
/** TEP-64 per-value data prefix: 0x00 = snake, 0x01 = chunked. */
const SNAKE_DATA_PREFIX = 0x00;
const CHUNKED_DATA_PREFIX = 0x01;

/**
 * Derives the TEP-64 onchain dictionary key for an attribute: sha256(name) as a 256-bit int.
 * This is the single source of truth shared by the metadata writer and reader.
 */
export function onchainMetadataKey(key: string): bigint {
    return BigInt(`0x${createHash('sha256').update(key, 'utf8').digest('hex')}`);
}

/** Reads a TEP-64 ContentData value cell (snake or chunked) into a UTF-8 string. */
function readContentValue(value: Cell): string {
    const slice = value.beginParse();
    if (slice.remainingBits < 8) {
        return '';
    }
    const dataPrefix = slice.loadUint(8);
    if (dataPrefix === SNAKE_DATA_PREFIX) {
        return slice.loadStringTail();
    }
    if (dataPrefix === CHUNKED_DATA_PREFIX) {
        const chunks = slice.loadDict(Dictionary.Keys.Uint(32), Dictionary.Values.Cell());
        return chunks
            .keys()
            .sort((a, b) => a - b)
            .map((index) => chunks.get(index)!.beginParse().loadStringTail())
            .join('');
    }
    return '';
}

/**
 * Reads a single attribute from a TEP-64 onchain content cell (layout prefix 0x00),
 * looking the value up by sha256(key) and decoding its snake/chunked payload.
 *
 * Returns undefined when the cell is missing, offchain, malformed, or the key is absent.
 */
export function readOnchainMetadataValue(content: Cell | null, key: string): string | undefined {
    if (!content) {
        return undefined;
    }
    try {
        const slice = content.beginParse();
        if (slice.remainingBits < 8) {
            return undefined;
        }
        const prefix = slice.loadUint(8);
        if (prefix !== ONCHAIN_CONTENT_PREFIX) {
            // Offchain content (0x01) stores a URI, not per-key onchain attributes.
            return undefined;
        }
        const dict = slice.loadDict(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
        const value = dict.get(onchainMetadataKey(key));
        if (!value) {
            return undefined;
        }
        const text = readContentValue(value).trim();
        return text || undefined;
    } catch {
        return undefined;
    }
}
