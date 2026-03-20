/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { FileBackedStorageAdapter } from '../services/FileBackedStorageAdapter.js';
import { TonConnectStore } from '../services/TonConnectStore.js';

describe('TonConnectStore', () => {
    let tempDir = '';
    let store: TonConnectStore;

    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'tonconnect-store-'));
        store = new TonConnectStore(
            new FileBackedStorageAdapter(join(tempDir, 'tonconnect-storage.json'), {
                prefix: 'test:',
            }),
        );
    });

    afterEach(() => {
        rmSync(tempDir, { recursive: true, force: true });
    });

    it('persists requests and updates their status', async () => {
        await store.upsertRequest({
            requestId: 'req-1',
            type: 'connect',
            status: 'pending',
            createdAt: '2026-03-20T10:00:00.000Z',
            updatedAt: '2026-03-20T10:00:00.000Z',
            summary: {
                requestId: 'req-1',
                type: 'connect',
                sessionId: 'sess-1',
                requestedItems: ['ton_addr'],
                permissions: [],
            },
        });

        const pending = await store.listRequests({ status: 'pending' });
        expect(pending).toHaveLength(1);
        expect(pending[0]?.requestId).toBe('req-1');

        const approved = await store.updateRequestStatus('req-1', 'approved');
        expect(approved?.status).toBe('approved');
        expect(approved?.completedAt).toBeTruthy();

        const persistedStore = new TonConnectStore(
            new FileBackedStorageAdapter(join(tempDir, 'tonconnect-storage.json'), {
                prefix: 'test:',
            }),
        );
        const restored = await persistedStore.getRequest('req-1');
        expect(restored?.status).toBe('approved');
    });

    it('expires only pending requests for a disconnected session', async () => {
        await store.upsertRequest({
            requestId: 'req-pending',
            type: 'signData',
            status: 'pending',
            createdAt: '2026-03-20T10:00:00.000Z',
            updatedAt: '2026-03-20T10:00:00.000Z',
            summary: {
                requestId: 'req-pending',
                type: 'signData',
                sessionId: 'sess-1',
                signDataType: 'text',
                previewText: 'hello',
                contentLength: 5,
            },
        });
        await store.upsertRequest({
            requestId: 'req-approved',
            type: 'sendTransaction',
            status: 'approved',
            createdAt: '2026-03-20T10:00:00.000Z',
            updatedAt: '2026-03-20T10:00:01.000Z',
            completedAt: '2026-03-20T10:00:01.000Z',
            summary: {
                requestId: 'req-approved',
                type: 'sendTransaction',
                sessionId: 'sess-1',
                messages: [],
            },
        });

        await store.expirePendingBySession('sess-1', 'Session disconnected');

        expect((await store.getRequest('req-pending'))?.status).toBe('expired');
        expect((await store.getRequest('req-pending'))?.reason).toBe('Session disconnected');
        expect((await store.getRequest('req-approved'))?.status).toBe('approved');
    });
});
