/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { makeTx, makeEmptyTrace, makeTrace, JETTON_TRANSFER, JETTON_NOTIFY, EXCESS, UNKNOWN } from './testFixtures';
import { isFailedTrace } from '../isFailedTrace';

describe('isFailedTrace', () => {
    describe('edge cases', () => {
        it('returns false when traces array is empty', () => {
            expect(isFailedTrace(makeEmptyTrace())).toBe(false);
        });

        it('returns false when traces[0].transactions is empty', () => {
            expect(isFailedTrace(makeTrace({}))).toBe(false);
        });
    });

    describe('Jetton Transfer flow (known trace type)', () => {
        // Trigger: any tx with JETTON_TRANSFER opcode
        // Safe-to-skip: JETTON_NOTIFY, EXCESS

        it('returns false when all transactions succeed', () => {
            const txs = {
                a: makeTx(JETTON_TRANSFER),
                b: makeTx(JETTON_NOTIFY),
                c: makeTx(EXCESS),
            };
            expect(isFailedTrace(makeTrace({ transactions: txs }))).toBe(false);
        });

        it('returns false when only JETTON_NOTIFY fails (safe-to-skip)', () => {
            const txs = {
                a: makeTx(JETTON_TRANSFER),
                b: makeTx(JETTON_NOTIFY, true), // allowed to fail
            };
            expect(isFailedTrace(makeTrace({ transactions: txs }))).toBe(false);
        });

        it('returns false when only EXCESS fails (safe-to-skip)', () => {
            const txs = {
                a: makeTx(JETTON_TRANSFER),
                b: makeTx(EXCESS, true), // allowed to fail
            };
            expect(isFailedTrace(makeTrace({ transactions: txs }))).toBe(false);
        });

        it('returns false when both JETTON_NOTIFY and EXCESS fail', () => {
            const txs = {
                a: makeTx(JETTON_TRANSFER),
                b: makeTx(JETTON_NOTIFY, true),
                c: makeTx(EXCESS, true),
            };
            expect(isFailedTrace(makeTrace({ transactions: txs }))).toBe(false);
        });

        it('returns true when the main JETTON_TRANSFER tx fails', () => {
            const txs = {
                a: makeTx(JETTON_TRANSFER, true), // critical failure
                b: makeTx(JETTON_NOTIFY),
            };
            expect(isFailedTrace(makeTrace({ transactions: txs }))).toBe(true);
        });

        it('returns true when a non-whitelisted tx fails alongside safe ones', () => {
            const txs = {
                a: makeTx(JETTON_TRANSFER),
                b: makeTx(JETTON_NOTIFY, true), // safe — ignored
                c: makeTx(UNKNOWN, true), // not whitelisted → failure
            };
            expect(isFailedTrace(makeTrace({ transactions: txs }))).toBe(true);
        });
    });

    describe('unknown trace type (fallback — strict mode)', () => {
        // No trigger opcode present → uses createFailureDetector(new Set())

        it('returns false when all txs succeed', () => {
            const txs = { a: makeTx(UNKNOWN), b: makeTx(null) };
            expect(isFailedTrace(makeTrace({ transactions: txs }))).toBe(false);
        });

        it('returns true when any tx fails (no whitelist)', () => {
            const txs = { a: makeTx(UNKNOWN, true) };
            expect(isFailedTrace(makeTrace({ transactions: txs }))).toBe(true);
        });

        it('does NOT whitelist Jetton opcodes when trace type is unrecognised', () => {
            // No JETTON_TRANSFER trigger → fallback mode → JETTON_NOTIFY/EXCESS are NOT safe-to-skip
            const txs = {
                a: makeTx(JETTON_NOTIFY, true),
                b: makeTx(EXCESS, true),
            };
            expect(isFailedTrace(makeTrace({ transactions: txs }))).toBe(true);
        });
    });
});
