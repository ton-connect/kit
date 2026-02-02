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
 * This module provides:
 * - Factory function for creating multi-user MCP servers with pluggable adapters
 * - Standalone MCP server for single-user CLI use
 * - Adapter interfaces for custom storage and signing implementations
 * - Example adapters for testing and development
 */

// ===========================================
// Factory and Configuration
// ===========================================

export { createTonWalletMCP } from './factory.js';

// ===========================================
// Type Exports (for implementers)
// ===========================================

export type {
    IStorageAdapter,
    ISignerAdapter,
    WalletInfo,
    CreateWalletParams,
    ImportWalletParams,
    IUserContextProvider,
    RequestContext,
    IContactResolver,
    Contact,
    TonMcpConfig,
    LimitsConfig,
} from './types/index.js';

// ===========================================
// Example Adapters
// ===========================================

export {
    InMemoryStorageAdapter,
    LocalSignerAdapter,
    SqliteStorageAdapter,
    SqliteSignerAdapter,
    TelegramUserContextProvider,
    StaticUserContextProvider,
} from './adapters/index.js';

export type {
    TelegramUserContextConfig,
    SqliteDatabase,
    SqliteStorageConfig,
    SqliteSignerConfig,
} from './adapters/index.js';

// ===========================================
// Core Utilities (for advanced use)
// ===========================================

export { UserScopedStorage } from './core/UserScopedStorage.js';
export { UserScopedSigner } from './core/UserScopedSigner.js';
export { LimitsManager } from './core/LimitsManager.js';
export type { LimitCheckResult } from './core/LimitsManager.js';
export { PendingTransactionManager } from './core/PendingTransactionManager.js';
export type {
    PendingTransaction,
    PendingTransactionType,
    PendingTonTransfer,
    PendingJettonTransfer,
    PendingSwap,
} from './core/PendingTransactionManager.js';

// ===========================================
// Services
// ===========================================

export { McpWalletService } from './services/McpWalletService.js';
export type {
    McpWalletInfo,
    McpWalletServiceConfig,
    NetworkConfig,
    CreateWalletResult,
    ImportWalletResult,
    JettonInfoResult,
    TransferResult,
    SwapQuoteResult,
    SwapResult,
} from './services/McpWalletService.js';

// Legacy WalletService for standalone use
export { WalletService } from './services/WalletService.js';

// ===========================================
// Standalone Server Entry Point
// ===========================================

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { WalletService } from './services/WalletService.js';
import { createWalletTools, createBalanceTools, createTransferTools, createSwapTools } from './tools/index.js';

const SERVER_NAME = 'ton-mcp';
const SERVER_VERSION = '0.1.0';

// Log to stderr since stdout is used for MCP communication
function log(message: string) {
    // eslint-disable-next-line no-console
    console.error(`[${SERVER_NAME}] ${message}`);
}

/**
 * Main entry point for standalone MCP server.
 * This is used when running the package directly as an MCP server.
 */
async function main() {
    log(`Starting ${SERVER_NAME} v${SERVER_VERSION}...`);

    // Initialize wallet service (supports both mainnet and testnet)
    const walletService = new WalletService();
    log('Wallet service initialized (supports mainnet and testnet)');

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
    const swapTools = createSwapTools(walletService);
    log('Tools created');

    // Helper to register tools with type assertion (Zod version mismatch workaround)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registerTool = (name: string, tool: { description: string; inputSchema: any; handler: any }) => {
        server.registerTool(name, { description: tool.description, inputSchema: tool.inputSchema }, tool.handler);
    };

    // Register wallet management tools
    registerTool('create_wallet', walletTools.create_wallet);
    registerTool('import_wallet', walletTools.import_wallet);
    registerTool('list_wallets', walletTools.list_wallets);
    registerTool('remove_wallet', walletTools.remove_wallet);

    // Register balance tools
    registerTool('get_balance', balanceTools.get_balance);
    registerTool('get_jetton_balance', balanceTools.get_jetton_balance);
    registerTool('get_jettons', balanceTools.get_jettons);
    registerTool('get_transactions', balanceTools.get_transactions);

    // Register transfer tools
    registerTool('send_ton', transferTools.send_ton);
    registerTool('send_jetton', transferTools.send_jetton);

    // Register swap tools
    registerTool('get_swap_quote', swapTools.get_swap_quote);
    registerTool('execute_swap', swapTools.execute_swap);

    log(
        'Registered 12 tools: create_wallet, import_wallet, list_wallets, remove_wallet, get_balance, get_jetton_balance, get_jettons, get_transactions, send_ton, send_jetton, get_swap_quote, execute_swap',
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

// Export main for programmatic use
export { main as runStandaloneServer };
