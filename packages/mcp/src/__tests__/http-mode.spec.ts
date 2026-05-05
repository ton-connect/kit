/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createTonWalletMCP } from '../factory.js';
import { createHttpMcpSessionRouter } from '../http-mode.js';

describe('HTTP MCP mode', () => {
    const originalConfigPath = process.env.TON_CONFIG_PATH;
    let tempDir = '';

    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'ton-mcp-http-'));
        process.env.TON_CONFIG_PATH = join(tempDir, 'config.json');
    });

    afterEach(() => {
        if (originalConfigPath) {
            process.env.TON_CONFIG_PATH = originalConfigPath;
        } else {
            delete process.env.TON_CONFIG_PATH;
        }
        rmSync(tempDir, { recursive: true, force: true });
    });

    it('supports multiple independent HTTP sessions', async () => {
        const router = createHttpMcpSessionRouter({
            host: '127.0.0.1',
            port: 0,
            createServerInstance: async () => {
                const server = await createTonWalletMCP({});
                return {
                    server,
                    close: async () => {},
                };
            },
        });

        const httpServer = createServer((req, res) => {
            void router.handleRequest(req, res);
        });
        await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', () => resolve()));

        const address = httpServer.address();
        if (!address || typeof address === 'string') {
            throw new Error('Failed to get HTTP server address');
        }

        const baseUrl = new URL(`http://127.0.0.1:${address.port}/mcp`);
        const firstClient = new Client({ name: 'http-test-1', version: '1.0.0' });
        const secondClient = new Client({ name: 'http-test-2', version: '1.0.0' });
        const firstTransport = new StreamableHTTPClientTransport(baseUrl);
        const secondTransport = new StreamableHTTPClientTransport(baseUrl);

        try {
            await firstClient.connect(firstTransport);
            await secondClient.connect(secondTransport);

            const firstTools = await firstClient.listTools();
            const secondTools = await secondClient.listTools();

            expect(firstTools.tools.some((tool) => tool.name === 'get_balance')).toBe(true);
            expect(secondTools.tools.some((tool) => tool.name === 'get_balance')).toBe(true);
            expect(router.getSessionCount()).toBeGreaterThanOrEqual(2);
        } finally {
            await Promise.allSettled([firstClient.close(), secondClient.close(), router.close()]);
            await new Promise<void>((resolve, reject) => {
                httpServer.close((error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        }
    });
});
