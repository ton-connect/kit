/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * TON MCP CLI - Command-line MCP server for TON wallet management
 *
 * This CLI runs a Model Context Protocol server that provides
 * TON wallet management tools for use with Claude Desktop or other MCP clients.
 *
 * Usage:
 *   npx @ton/mcp                          # stdio mode (default)
 *   npx @ton/mcp --http                   # HTTP server on 0.0.0.0:3000
 *   npx @ton/mcp --http 8080              # HTTP server on custom port
 *   npx @ton/mcp --http --host 127.0.0.1  # HTTP server on custom host
 */

import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import { createTonWalletMCP } from './factory.js';
import { InMemoryStorageAdapter } from './adapters/InMemoryStorageAdapter.js';
import { LocalSignerAdapter } from './adapters/LocalSignerAdapter.js';
import { StaticUserContextProvider } from './adapters/TelegramUserContextProvider.js';

const SERVER_NAME = 'ton-mcp';

// Read network from environment variable (default: mainnet)
const NETWORK = (process.env.NETWORK as 'mainnet' | 'testnet') || 'mainnet';

function log(message: string) {
    // eslint-disable-next-line no-console
    console.error(`[${SERVER_NAME}] ${message}`);
}

function parseArgs() {
    const args = process.argv.slice(2);
    const httpIndex = args.indexOf('--http');

    if (httpIndex === -1) {
        return { mode: 'stdio' as const };
    }

    const nextArg = args[httpIndex + 1];
    const port = nextArg && !nextArg.startsWith('-') ? parseInt(nextArg, 10) : 3000;

    const hostIndex = args.indexOf('--host');
    const hostArg = hostIndex !== -1 ? args[hostIndex + 1] : undefined;
    const host = hostArg && !hostArg.startsWith('-') ? hostArg : '0.0.0.0';

    return { mode: 'http' as const, port, host };
}

function createAdaptersAndServer() {
    const storage = new InMemoryStorageAdapter();
    const signer = new LocalSignerAdapter();
    const userContext = new StaticUserContextProvider('cli-user');

    const server = createTonWalletMCP({
        storage,
        signer,
        userContext,
        network: NETWORK,
        requireConfirmation: false,
    });

    return { server, signer };
}

async function startStdio() {
    log('Starting in stdio mode...');
    log(`Network: ${NETWORK}`);

    const { server, signer } = createAdaptersAndServer();
    const transport = new StdioServerTransport();

    const shutdown = async () => {
        log('Shutting down...');
        await signer.close();
        log('Shutdown complete');
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    await server.connect(transport);
    log('Server connected and ready to accept requests');
}

async function startHttp(port: number, host: string) {
    log(`Starting in HTTP mode on ${host}:${port}...`);
    log(`Network: ${NETWORK}`);

    const { server, signer } = createAdaptersAndServer();

    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
    });

    await server.connect(transport);

    const httpServer = createServer(async (req, res) => {
        const url = new URL(req.url ?? '/', `http://${host}:${port}`);

        if (url.pathname === '/mcp') {
            await transport.handleRequest(req, res);
        } else {
            res.writeHead(404).end('Not Found');
        }
    });

    const shutdown = async () => {
        log('Shutting down...');
        httpServer.close();
        await transport.close();
        await signer.close();
        log('Shutdown complete');
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    httpServer.listen(port, host, () => {
        log(`HTTP server listening on http://${host}:${port}/mcp`);
    });
}

const config = parseArgs();

if (config.mode === 'http') {
    startHttp(config.port, config.host).catch((error) => {
        // eslint-disable-next-line no-console
        console.error(`[${SERVER_NAME}] Fatal error:`, error);
        process.exit(1);
    });
} else {
    startStdio().catch((error) => {
        // eslint-disable-next-line no-console
        console.error(`[${SERVER_NAME}] Fatal error:`, error);
        process.exit(1);
    });
}
