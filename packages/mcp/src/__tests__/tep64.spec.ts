/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Dictionary, beginCell } from '@ton/core';
import type { Cell } from '@ton/core';
import { describe, expect, it } from 'vitest';

import { onchainMetadataKey, readOnchainMetadataValue } from '../utils/tep64.js';

/** Build a TEP-64 onchain content cell (prefix 0x00) from name -> value cell pairs. */
function onchainContent(values: Record<string, Cell>): Cell {
    const dict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
    for (const [name, value] of Object.entries(values)) {
        dict.set(onchainMetadataKey(name), value);
    }
    return beginCell().storeUint(0x00, 8).storeDict(dict).endCell();
}

function snakeValue(text: string): Cell {
    return beginCell().storeUint(0x00, 8).storeStringTail(text).endCell();
}

describe('readOnchainMetadataValue', () => {
    it('reads a snake-encoded attribute back by name', () => {
        const content = onchainContent({ limits_hash: snakeValue('deadbeef'), name: snakeValue('Agent') });
        expect(readOnchainMetadataValue(content, 'limits_hash')).toBe('deadbeef');
        expect(readOnchainMetadataValue(content, 'name')).toBe('Agent');
    });

    it('joins chunked values in key order', () => {
        const chunks = Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.Cell());
        chunks.set(0, beginCell().storeStringTail('foo').endCell());
        chunks.set(1, beginCell().storeStringTail('bar').endCell());
        const content = onchainContent({ name: beginCell().storeUint(0x01, 8).storeDict(chunks).endCell() });
        expect(readOnchainMetadataValue(content, 'name')).toBe('foobar');
    });

    it('returns undefined for an absent key, offchain content, or no content', () => {
        const content = onchainContent({ name: snakeValue('Agent') });
        expect(readOnchainMetadataValue(content, 'limits_hash')).toBeUndefined();
        expect(
            readOnchainMetadataValue(beginCell().storeUint(0x01, 8).storeStringTail('https://x').endCell(), 'name'),
        ).toBeUndefined();
        expect(readOnchainMetadataValue(null, 'name')).toBeUndefined();
    });
});
