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

import {
    AgenticSetupSessionManager,
    ConfigBackedAgenticSetupSessionStore,
} from '../services/AgenticSetupSessionManager.js';

describe('AgenticSetupSessionManager', () => {
    const managers: AgenticSetupSessionManager[] = [];
    const originalConfigPath = process.env.TON_CONFIG_PATH;
    let tempDir = '';

    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'ton-mcp-agentic-sessions-'));
        process.env.TON_CONFIG_PATH = join(tempDir, 'config.json');
    });

    afterEach(async () => {
        while (managers.length > 0) {
            const manager = managers.pop();
            if (manager) {
                await manager.close();
            }
        }
        if (originalConfigPath) {
            process.env.TON_CONFIG_PATH = originalConfigPath;
        } else {
            delete process.env.TON_CONFIG_PATH;
        }
        rmSync(tempDir, { recursive: true, force: true });
    });

    it('accepts dashboard callback payloads', async () => {
        const manager = new AgenticSetupSessionManager();
        managers.push(manager);

        const session = await manager.createSession('setup-1');
        const response = await fetch(session.callbackUrl, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                event: 'agent_wallet_deployed',
                wallet: {
                    address: 'kQAgent',
                },
            }),
        });

        expect(response.status).toBe(200);
        expect(manager.getSession('setup-1')).toMatchObject({
            status: 'callback_received',
            payload: {
                event: 'agent_wallet_deployed',
                wallet: {
                    address: 'kQAgent',
                },
            },
        });
    });

    it('answers CORS preflight requests', async () => {
        const manager = new AgenticSetupSessionManager();
        managers.push(manager);

        const session = await manager.createSession('setup-2');
        const response = await fetch(session.callbackUrl, {
            method: 'OPTIONS',
            headers: {
                origin: 'http://localhost:5173',
                'access-control-request-method': 'POST',
                'access-control-request-headers': 'content-type',
            },
        });

        expect(response.status).toBe(204);
        expect(response.headers.get('access-control-allow-origin')).toBe('*');
        expect(response.headers.get('access-control-allow-methods')).toContain('POST');
    });

    it('marks sessions as completed and cancelled', async () => {
        const manager = new AgenticSetupSessionManager();
        managers.push(manager);

        await manager.createSession('setup-3');
        manager.markCompleted('setup-3');
        expect(manager.getSession('setup-3')).toBeNull();

        await manager.createSession('setup-4');
        manager.cancelSession('setup-4');
        expect(manager.getSession('setup-4')).toBeNull();
    });

    it('restores persisted callback payloads and callback urls from config-backed store', async () => {
        const store = new ConfigBackedAgenticSetupSessionStore();
        const manager = new AgenticSetupSessionManager({ store });
        managers.push(manager);

        const session = await manager.createSession('setup-5');
        expect(session.callbackUrl).toContain('/agentic/callback/setup-5');

        const response = await fetch(session.callbackUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                event: 'agent_wallet_deployed',
                wallet: {
                    address: 'kQAgentRecoverable',
                },
            }),
        });
        expect(response.status).toBe(200);

        const reopened = new AgenticSetupSessionManager({
            store,
        });
        managers.push(reopened);

        expect(reopened.getSession('setup-5')).toMatchObject({
            callbackUrl: session.callbackUrl,
            status: 'callback_received',
            payload: {
                wallet: {
                    address: 'kQAgentRecoverable',
                },
            },
        });
    });
});
