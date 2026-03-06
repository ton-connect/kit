/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { makeEmptyTrace, makeTrace, makeTx, JETTON_TRANSFER, UNKNOWN } from './testFixtures';
import { parseTraceResponse } from '../parseTraceResponse';

describe('parseTraceResponse', () => {
    describe('returns null', () => {
        it('when traces array is empty', () => {
            expect(parseTraceResponse(makeEmptyTrace())).toBeNull();
        });

        it('when traces is undefined', () => {
            // @ts-expect-error testing runtime guard
            expect(parseTraceResponse({ traces: undefined })).toBeNull();
        });
    });

    describe('message counters', () => {
        it('totalMessages reflects trace_info.messages', () => {
            const result = parseTraceResponse(makeTrace({ messages: 5, pending_messages: 0 }));
            expect(result?.totalMessages).toBe(5);
        });

        it('pendingMessages reflects trace_info.pending_messages', () => {
            const result = parseTraceResponse(makeTrace({ messages: 3, pending_messages: 2 }));
            expect(result?.pendingMessages).toBe(2);
        });

        it('onchainMessages = messages − pending_messages', () => {
            const result = parseTraceResponse(makeTrace({ messages: 4, pending_messages: 1 }));
            expect(result?.onchainMessages).toBe(3);
        });
    });

    describe('status: pending', () => {
        it('returns pending when pending_messages > 0, regardless of trace_state', () => {
            const result = parseTraceResponse(makeTrace({ trace_state: 'complete', pending_messages: 1, messages: 3 }));
            expect(result?.status).toBe('pending');
        });
    });

    describe('status: completed', () => {
        it('returns completed when trace_state is complete and pending_messages is 0', () => {
            const result = parseTraceResponse(makeTrace({ trace_state: 'complete', pending_messages: 0 }));
            expect(result?.status).toBe('completed');
        });

        it('returns completed when trace_state is pending but pending_messages is 0', () => {
            // "pending" trace state but no actually pending messages = effectively done
            const result = parseTraceResponse(makeTrace({ trace_state: 'pending', pending_messages: 0 }));
            expect(result?.status).toBe('completed');
        });
    });

    describe('status: failed', () => {
        it('returns failed when a non-whitelisted tx has failed (unknown trace type)', () => {
            const result = parseTraceResponse(
                makeTrace({
                    pending_messages: 0,
                    transactions: { a: makeTx(UNKNOWN, true) },
                }),
            );
            expect(result?.status).toBe('failed');
        });

        it('returns failed when JETTON_TRANSFER itself fails', () => {
            const result = parseTraceResponse(
                makeTrace({
                    pending_messages: 0,
                    transactions: {
                        a: makeTx(JETTON_TRANSFER, true),
                    },
                }),
            );
            expect(result?.status).toBe('failed');
        });

        it('does NOT return failed when only whitelisted opcodes fail in a Jetton trace', () => {
            // JETTON_NOTIFY is safe-to-skip in a jetton transfer flow
            const result = parseTraceResponse(
                makeTrace({
                    pending_messages: 0,
                    transactions: {
                        a: makeTx(JETTON_TRANSFER), // trigger — success
                        b: makeTx('0x7362d09c', true), // jetton_notify — safe to fail
                    },
                }),
            );
            expect(result?.status).toBe('completed');
        });

        it('does not check failure when pending_messages > 0 (status stays pending)', () => {
            // Even if tx failed, we should report pending while messages are in flight
            const result = parseTraceResponse(
                makeTrace({
                    pending_messages: 1,
                    messages: 2,
                    transactions: { a: makeTx(UNKNOWN, true) },
                }),
            );
            expect(result?.status).toBe('pending');
        });
    });
});
