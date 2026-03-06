/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { makeTx, JETTON_TRANSFER, JETTON_NOTIFY, EXCESS, UNKNOWN } from './testFixtures';
import { createTraceTypeDetector } from '../createTraceTypeDetector';

describe('createTraceTypeDetector', () => {
    describe('empty trigger set', () => {
        const detect = createTraceTypeDetector(new Set());

        it('returns false for empty transactions map', () => {
            expect(detect({})).toBe(false);
        });

        it('returns false regardless of what opcodes are present', () => {
            expect(detect({ a: makeTx(JETTON_TRANSFER), b: makeTx(EXCESS) })).toBe(false);
        });
    });

    describe('single trigger opcode', () => {
        const detect = createTraceTypeDetector(new Set([JETTON_TRANSFER]));

        it('returns false when no tx matches the trigger', () => {
            expect(detect({ a: makeTx(JETTON_NOTIFY), b: makeTx(EXCESS) })).toBe(false);
        });

        it('returns false when tx has no in_msg (opcode is null)', () => {
            expect(detect({ a: makeTx(null) })).toBe(false);
        });

        it('returns true when the only tx matches the trigger', () => {
            expect(detect({ a: makeTx(JETTON_TRANSFER) })).toBe(true);
        });

        it('returns true when one of many txs matches the trigger', () => {
            expect(
                detect({
                    a: makeTx(JETTON_NOTIFY),
                    b: makeTx(JETTON_TRANSFER), // trigger
                    c: makeTx(EXCESS),
                }),
            ).toBe(true);
        });
    });

    describe('multiple trigger opcodes', () => {
        const detect = createTraceTypeDetector(new Set([JETTON_TRANSFER, JETTON_NOTIFY]));

        it('returns true when first trigger is matched', () => {
            expect(detect({ a: makeTx(JETTON_TRANSFER) })).toBe(true);
        });

        it('returns true when second trigger is matched', () => {
            expect(detect({ a: makeTx(JETTON_NOTIFY) })).toBe(true);
        });

        it('returns false when neither trigger is present', () => {
            expect(detect({ a: makeTx(EXCESS), b: makeTx(UNKNOWN) })).toBe(false);
        });
    });

    describe('factory creates independent detectors', () => {
        it('two detectors with different triggers behave independently', () => {
            const detectTransfer = createTraceTypeDetector(new Set([JETTON_TRANSFER]));
            const detectNotify = createTraceTypeDetector(new Set([JETTON_NOTIFY]));

            const txs = { a: makeTx(JETTON_TRANSFER) };

            expect(detectTransfer(txs)).toBe(true);
            expect(detectNotify(txs)).toBe(false);
        });
    });
});
