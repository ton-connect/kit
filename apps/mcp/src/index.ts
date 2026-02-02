/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * TON MCP Server - Model Context Protocol server for TON blockchain wallet operations
 *
 * This server provides tools for:
 * - Creating and importing TON wallets
 * - Checking TON and Jetton balances
 * - Sending TON and Jettons
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { WalletService } from './services/WalletService.js';
import { createWalletTools, createBalanceTools, createTransferTools } from './tools/index.js';

const SERVER_NAME = 'ton-mcp';
const SERVER_VERSION = '0.1.0';

// Log to stderr since stdout is used for MCP communication
function log(message: string) {
    // eslint-disable-next-line no-console
    console.error(`[${SERVER_NAME}] ${message}`);
}

async function main() {
    log(`Starting ${SERVER_NAME} v${SERVER_VERSION}...`);

    // Initialize wallet service (use NETWORK env var, defaults to mainnet)
    const network = (process.env.NETWORK === 'testnet' ? 'testnet' : 'mainnet') as 'mainnet' | 'testnet';
    const walletService = new WalletService(network);
    log(`Wallet service initialized (${network})`);

    // Create MCP server
    const server = new McpServer({
        name: SERVER_NAME,
        version: SERVER_VERSION,
    });
    log('MCP server created');

    // Get all tools
    const walletTools = createWalletTools(walletService);
    const balanceTools = createBalanceTools(walletService);
    const transferTools = createTransferTools(walletService);
    log('Tools created');

    // Register wallet management tools
    server.registerTool(
        'create_wallet',
        {
            description: walletTools.create_wallet.description,
            inputSchema: walletTools.create_wallet.inputSchema.shape,
        },
        walletTools.create_wallet.handler,
    );

    server.registerTool(
        'import_wallet',
        {
            description: walletTools.import_wallet.description,
            inputSchema: walletTools.import_wallet.inputSchema.shape,
        },
        walletTools.import_wallet.handler,
    );

    server.registerTool(
        'list_wallets',
        {
            description: walletTools.list_wallets.description,
            inputSchema: walletTools.list_wallets.inputSchema.shape,
        },
        walletTools.list_wallets.handler,
    );

    server.registerTool(
        'remove_wallet',
        {
            description: walletTools.remove_wallet.description,
            inputSchema: walletTools.remove_wallet.inputSchema.shape,
        },
        walletTools.remove_wallet.handler,
    );

    // Register balance tools
    server.registerTool(
        'get_balance',
        {
            description: balanceTools.get_balance.description,
            inputSchema: balanceTools.get_balance.inputSchema.shape,
        },
        balanceTools.get_balance.handler,
    );

    server.registerTool(
        'get_jetton_balance',
        {
            description: balanceTools.get_jetton_balance.description,
            inputSchema: balanceTools.get_jetton_balance.inputSchema.shape,
        },
        balanceTools.get_jetton_balance.handler,
    );

    server.registerTool(
        'get_jettons',
        {
            description: balanceTools.get_jettons.description,
            inputSchema: balanceTools.get_jettons.inputSchema.shape,
        },
        balanceTools.get_jettons.handler,
    );

    // Register transfer tools
    server.registerTool(
        'send_ton',
        {
            description: transferTools.send_ton.description,
            inputSchema: transferTools.send_ton.inputSchema.shape,
        },
        transferTools.send_ton.handler,
    );

    server.registerTool(
        'send_jetton',
        {
            description: transferTools.send_jetton.description,
            inputSchema: transferTools.send_jetton.inputSchema.shape,
        },
        transferTools.send_jetton.handler,
    );

    log(
        'Registered 9 tools: create_wallet, import_wallet, list_wallets, remove_wallet, get_balance, get_jetton_balance, get_jettons, send_ton, send_jetton',
    );

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        log('Received SIGINT, shutting down...');
        await walletService.close();
        log('Shutdown complete');
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        log('Received SIGTERM, shutting down...');
        await walletService.close();
        log('Shutdown complete');
        process.exit(0);
    });

    // Connect server to transport
    await server.connect(transport);
    log('Server connected and ready to accept requests');
}

main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(`[${SERVER_NAME}] Fatal error:`, error);
    process.exit(1);
});
