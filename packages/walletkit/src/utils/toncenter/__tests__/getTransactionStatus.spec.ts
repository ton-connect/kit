/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it, vi } from 'vitest';

import { getTransactionStatus } from '../getTransactionStatus';
import { makeClient, makeEmptyTrace, makeTrace } from './testFixtures';

const HASH = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=';

describe('getTransactionStatus', () => {
    describe('using normalizedHash param', () => {
        it('returns unknown when both getPendingTrace and getTrace return empty traces', async () => {
            const client = makeClient();
            const result = await getTransactionStatus(client, { normalizedHash: HASH });

            expect(result).toEqual({
                status: 'unknown',
                totalMessages: 0,
                pendingMessages: 0,
                onchainMessages: 0,
            });
        });

        it('returns result from getPendingTrace when it has traces', async () => {
            const client = makeClient({
                getPendingTrace: vi.fn().mockResolvedValue(makeTrace()),
            });
            const result = await getTransactionStatus(client, { normalizedHash: HASH });

            expect(result.status).toBe('completed');
            expect(result.totalMessages).toBe(2);
        });

        it('falls through to getTrace when getPendingTrace returns empty', async () => {
            const client = makeClient({
                getPendingTrace: vi.fn().mockResolvedValue(makeEmptyTrace()),
                getTrace: vi.fn().mockResolvedValue(makeTrace()),
            });
            const result = await getTransactionStatus(client, { normalizedHash: HASH });

            expect(result.status).toBe('completed');
        });

        it('ignores getPendingTrace error and tries getTrace', async () => {
            const client = makeClient({
                getPendingTrace: vi.fn().mockRejectedValue(new Error('404 not found')),
                getTrace: vi.fn().mockResolvedValue(makeTrace()),
            });
            const result = await getTransactionStatus(client, { normalizedHash: HASH });

            expect(result.status).toBe('completed');
        });

        it('returns unknown when both getPendingTrace and getTrace throw', async () => {
            const client = makeClient({
                getPendingTrace: vi.fn().mockRejectedValue(new Error('network error')),
                getTrace: vi.fn().mockRejectedValue(new Error('network error')),
            });
            const result = await getTransactionStatus(client, { normalizedHash: HASH });

            expect(result.status).toBe('unknown');
        });

        it('ignores getTrace error and returns unknown', async () => {
            const client = makeClient({
                getPendingTrace: vi.fn().mockResolvedValue(makeEmptyTrace()),
                getTrace: vi.fn().mockRejectedValue(new Error('timeout')),
            });
            const result = await getTransactionStatus(client, { normalizedHash: HASH });

            expect(result.status).toBe('unknown');
        });

        it('passes the hash directly to getPendingTrace', async () => {
            const getPendingTrace = vi.fn().mockResolvedValue(makeEmptyTrace());
            const client = makeClient({ getPendingTrace });

            await getTransactionStatus(client, { normalizedHash: HASH });

            expect(getPendingTrace).toHaveBeenCalledWith({ externalMessageHash: [HASH] });
        });

        it('passes the hash directly to getTrace', async () => {
            const getTrace = vi.fn().mockResolvedValue(makeEmptyTrace());
            const client = makeClient({
                getPendingTrace: vi.fn().mockResolvedValue(makeEmptyTrace()),
                getTrace,
            });

            await getTransactionStatus(client, { normalizedHash: HASH });

            expect(getTrace).toHaveBeenCalledWith({ traceId: [HASH] });
        });

        it('does not call getTrace when getPendingTrace already returned a result', async () => {
            const getTrace = vi.fn();
            const client = makeClient({
                getPendingTrace: vi.fn().mockResolvedValue(makeTrace()),
                getTrace,
            });

            await getTransactionStatus(client, { normalizedHash: HASH });

            expect(getTrace).not.toHaveBeenCalled();
        });

        it('returns pending status when trace has pending_messages > 0', async () => {
            const pendingTrace = makeTrace({ trace_state: 'pending' });
            pendingTrace.traces[0].trace_info.messages = 3;
            pendingTrace.traces[0].trace_info.pending_messages = 2;

            const client = makeClient({
                getPendingTrace: vi.fn().mockResolvedValue(pendingTrace),
            });

            const result = await getTransactionStatus(client, { normalizedHash: HASH });

            expect(result.status).toBe('pending');
            expect(result.pendingMessages).toBe(2);
            expect(result.totalMessages).toBe(3);
            expect(result.onchainMessages).toBe(1);
        });
    });
});
