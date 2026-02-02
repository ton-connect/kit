#!/usr/bin/env node

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
 *   node dist/index.js
 *   # or via pnpm:
 *   pnpm --filter @ton/mcp-cli start
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createTonWalletMCP, InMemoryStorageAdapter, LocalSignerAdapter, StaticUserContextProvider } from '@ton/mcp';

const SERVER_NAME = 'ton-mcp-cli';

// Read network from environment variable (default: mainnet)
const NETWORK = (process.env.NETWORK as 'mainnet' | 'testnet') || 'mainnet';

// Log to stderr since stdout is used for MCP communication
function log(message: string) {
    // eslint-disable-next-line no-console
    console.error(`[${SERVER_NAME}] ${message}`);
}

async function main() {
    log('Starting TON MCP CLI server...');
    log(`Network: ${NETWORK}`);

    // Create adapters for single-user CLI mode
    const storage = new InMemoryStorageAdapter();
    const signer = new LocalSignerAdapter();
    const userContext = new StaticUserContextProvider('cli-user');

    log('Adapters initialized (in-memory storage, local signer)');

    // Create the MCP server with the adapters
    const server = createTonWalletMCP({
        storage,
        signer,
        userContext,
        network: NETWORK,
        // No confirmation required for CLI (direct execution)
        requireConfirmation: false,
    });

    log(`MCP server created with network: ${NETWORK}`);

    // Create stdio transport for MCP communication
    const transport = new StdioServerTransport();

    // Handle graceful shutdown
    const shutdown = async () => {
        log('Shutting down...');
        // Close signer to cleanup TonWalletKit
        await signer.close();
        log('Shutdown complete');
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Connect and start serving
    await server.connect(transport);
    log('Server connected and ready to accept requests');
}

main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(`[${SERVER_NAME}] Fatal error:`, error);
    process.exit(1);
});
