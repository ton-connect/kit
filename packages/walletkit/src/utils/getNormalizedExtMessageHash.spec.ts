/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import { Address, beginCell, storeMessage, Cell } from '@ton/core';

import { getNormalizedExtMessageHash } from './getNormalizedExtMessageHash';

// ---------------------------------------------------------------------------
// Helpers to build real BOC strings from @ton/core primitives
// ---------------------------------------------------------------------------

function makeExternalInBoc(options: {
    dest?: Address;
    importFee?: bigint;
    body?: Cell;
    withStateInit?: boolean;
}): string {
    const dest = options.dest ?? Address.parseRaw('0:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    const body = options.body ?? beginCell().storeUint(0xdeadbeef, 32).endCell();

    const message = {
        info: {
            type: 'external-in' as const,
            dest,
            src: undefined,
            importFee: options.importFee ?? 1000n,
        },
        init: options.withStateInit
            ? {
                  code: beginCell().storeUint(0xff, 8).endCell(),
                  data: beginCell().storeUint(0x00, 8).endCell(),
              }
            : null,
        body,
    };

    const cell = beginCell()
        .store(storeMessage(message, { forceRef: true }))
        .endCell();

    return cell.toBoc().toString('base64');
}

function makeInternalBoc(): string {
    const addr = Address.parseRaw('0:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    const message = {
        info: {
            type: 'internal' as const,
            ihrDisabled: true,
            bounce: false,
            bounced: false,
            src: addr,
            dest: addr,
            value: { coins: 1_000_000_000n },
            ihrFee: 0n,
            forwardFee: 0n,
            createdLt: 0n,
            createdAt: 0,
        },
        init: null,
        body: Cell.EMPTY,
    };

    return beginCell().store(storeMessage(message)).endCell().toBoc().toString('base64');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getNormalizedExtMessageHash', () => {
    it('returns an object with a valid hash and a valid base64-encoded boc', () => {
        const boc = makeExternalInBoc({});
        const result = getNormalizedExtMessageHash(boc);

        expect(typeof result.hash).toBe('string');
        expect(result.hash).toMatch(/^0x[0-9a-f]+$/);

        expect(typeof result.boc).toBe('string');
        // Should not throw
        expect(() => Cell.fromBase64(result.boc)).not.toThrow();
    });

    it('normalizes importFee to 0 — different importFees produce the same hash', () => {
        const boc1 = makeExternalInBoc({ importFee: 0n });
        const boc2 = makeExternalInBoc({ importFee: 999_999n });
        const result1 = getNormalizedExtMessageHash(boc1);
        const result2 = getNormalizedExtMessageHash(boc2);
        expect(result1.hash).toBe(result2.hash);
    });

    it('strips stateInit — message with and without stateInit produce the same hash', () => {
        const boc1 = makeExternalInBoc({ withStateInit: false });
        const boc2 = makeExternalInBoc({ withStateInit: true });
        const result1 = getNormalizedExtMessageHash(boc1);
        const result2 = getNormalizedExtMessageHash(boc2);
        expect(result1.hash).toBe(result2.hash);
    });

    it('is idempotent — applying twice produces the same hash', () => {
        const boc = makeExternalInBoc({});
        const first = getNormalizedExtMessageHash(boc);
        const second = getNormalizedExtMessageHash(first.boc);
        expect(second.hash).toBe(first.hash);
    });

    it('different bodies produce different hashes', () => {
        const boc1 = makeExternalInBoc({ body: beginCell().storeUint(0x01, 32).endCell() });
        const boc2 = makeExternalInBoc({ body: beginCell().storeUint(0x02, 32).endCell() });
        const result1 = getNormalizedExtMessageHash(boc1);
        const result2 = getNormalizedExtMessageHash(boc2);
        expect(result1.hash).not.toBe(result2.hash);
    });

    it('different dest addresses produce different hashes', () => {
        const boc1 = makeExternalInBoc({
            dest: Address.parseRaw('0:1111111111111111111111111111111111111111111111111111111111111111'),
        });
        const boc2 = makeExternalInBoc({
            dest: Address.parseRaw('0:2222222222222222222222222222222222222222222222222222222222222222'),
        });
        const result1 = getNormalizedExtMessageHash(boc1);
        const result2 = getNormalizedExtMessageHash(boc2);
        expect(result1.hash).not.toBe(result2.hash);
    });

    it('throws when the message type is not external-in (internal message)', () => {
        const boc = makeInternalBoc();
        expect(() => getNormalizedExtMessageHash(boc)).toThrow(/external-in/);
    });

    it('throws when boc is not a valid base64 cell', () => {
        expect(() => getNormalizedExtMessageHash('not-valid-base64!!!')).toThrow();
    });
});
