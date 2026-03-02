/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { makeTx, JETTON_TRANSFER, JETTON_NOTIFY, EXCESS, UNKNOWN } from './testFixtures';
import { createFailureDetector } from '../createFailureDetector';

describe('createFailureDetector', () => {
    describe('empty whitelist (strict mode)', () => {
        const detect = createFailureDetector(new Set());

        it('returns false for empty transactions map', () => {
            expect(detect({})).toBe(false);
        });

        it('returns false when all transactions succeed', () => {
            expect(detect({ a: makeTx(JETTON_TRANSFER), b: makeTx(EXCESS) })).toBe(false);
        });

        it('returns true when any transaction fails — no opcode', () => {
            expect(detect({ a: makeTx(null, true) })).toBe(true);
        });

        it('returns true as soon as ONE transaction fails, even if others succeed', () => {
            expect(
                detect({
                    a: makeTx(JETTON_TRANSFER), // success
                    b: makeTx(null, true), // fail, no opcode
                }),
            ).toBe(true);
        });
    });

    describe('with a whitelist of non-critical opcodes', () => {
        const detect = createFailureDetector(new Set([JETTON_NOTIFY, EXCESS]));

        it('returns false when all transactions succeed', () => {
            expect(detect({ a: makeTx(JETTON_TRANSFER), b: makeTx(JETTON_NOTIFY) })).toBe(false);
        });

        it('ignores failure of a whitelisted opcode (JETTON_NOTIFY)', () => {
            expect(detect({ a: makeTx(JETTON_NOTIFY, true) })).toBe(false);
        });

        it('ignores failure of a whitelisted opcode (EXCESS)', () => {
            expect(detect({ a: makeTx(EXCESS, true) })).toBe(false);
        });

        it('ignores failures of MULTIPLE whitelisted opcodes at once', () => {
            expect(
                detect({
                    a: makeTx(JETTON_NOTIFY, true),
                    b: makeTx(EXCESS, true),
                }),
            ).toBe(false);
        });

        it('returns true when a non-whitelisted opcode fails', () => {
            expect(detect({ a: makeTx(UNKNOWN, true) })).toBe(true);
        });

        it('returns true when a tx without opcode fails', () => {
            expect(detect({ a: makeTx(null, true) })).toBe(true);
        });

        it('returns true when non-whitelisted fails alongside whitelisted failures', () => {
            expect(
                detect({
                    a: makeTx(JETTON_NOTIFY, true), // whitelisted — ignored
                    b: makeTx(EXCESS, true), // whitelisted — ignored
                    c: makeTx(UNKNOWN, true), // not whitelisted → failure
                }),
            ).toBe(true);
        });
    });

    describe('factory creates independent detectors', () => {
        it('two detectors with different whitelists behave independently', () => {
            const strict = createFailureDetector(new Set());
            const lenient = createFailureDetector(new Set([JETTON_NOTIFY]));

            const txs = { a: makeTx(JETTON_NOTIFY, true) };

            expect(strict(txs)).toBe(true);
            expect(lenient(txs)).toBe(false);
        });
    });
});
