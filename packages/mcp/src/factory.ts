/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Factory function for creating configured MCP server instances
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { TonMcpConfig } from './types/config.js';
import type { RequestContext } from './types/user-context.js';
import { McpWalletService } from './services/McpWalletService.js';
import {
    createMcpWalletTools,
    createMcpBalanceTools,
    createMcpTransferTools,
    createMcpSwapTools,
    createMcpPendingTools,
} from './tools/mcp-tools.js';

const SERVER_NAME = 'ton-mcp';
const SERVER_VERSION = '0.1.0';

/**
 * Tool handler context with authenticated user
 */
export interface ToolContext {
    userId: string;
    requestContext: RequestContext;
}

/**
 * Create a configured TON Wallet MCP server
 *
 * @param config - Configuration with adapters and limits
 * @returns Configured McpServer instance
 *
 * @example
 * ```typescript
 * import { createTonWalletMCP, InMemoryStorageAdapter, LocalSignerAdapter } from '@ton/mcp';
 *
 * const server = createTonWalletMCP({
 *   storage: new InMemoryStorageAdapter(),
 *   signer: new LocalSignerAdapter(),
 *   userContext: {
 *     getUserId: async (ctx) => ctx.headers?.['x-user-id'] ?? null,
 *   },
 *   limits: {
 *     maxTransactionTon: 100,
 *     dailyLimitTon: 1000,
 *     maxWalletsPerUser: 10,
 *   },
 *   requireConfirmation: true,
 * });
 * ```
 */
export function createTonWalletMCP(config: TonMcpConfig): McpServer {
    // Create wallet service
    const walletService = new McpWalletService({
        storage: config.storage,
        signer: config.signer,
        contacts: config.contacts,
        defaultNetwork: config.network,
        limits: config.limits,
        requireConfirmation: config.requireConfirmation,
    });

    // Create MCP server
    const server = new McpServer({
        name: SERVER_NAME,
        version: SERVER_VERSION,
    });

    // Helper to authenticate and get user context
    const authenticateUser = async (requestContext: RequestContext): Promise<string> => {
        const userId = await config.userContext.getUserId(requestContext);
        if (!userId) {
            throw new Error('User authentication required');
        }
        return userId;
    };

    // Create authenticated tool handler wrapper
    const createAuthenticatedHandler = <TArgs, TResult>(
        handler: (args: TArgs, userId: string, walletService: McpWalletService) => Promise<TResult>,
    ) => {
        return async (args: TArgs, extra: unknown) => {
            // Extract request context from extra
            // In MCP, the request context is typically passed via headers or meta
            const extraObj = extra as { meta?: Record<string, unknown>; headers?: Record<string, string> } | undefined;
            const requestContext: RequestContext = {
                headers: extraObj?.headers,
                metadata: extraObj?.meta,
            };

            const userId = await authenticateUser(requestContext);
            return handler(args, userId, walletService);
        };
    };

    // Get all tools
    const walletTools = createMcpWalletTools(walletService, createAuthenticatedHandler);
    const balanceTools = createMcpBalanceTools(walletService, createAuthenticatedHandler);
    const transferTools = createMcpTransferTools(walletService, createAuthenticatedHandler);
    const swapTools = createMcpSwapTools(walletService, createAuthenticatedHandler);
    const pendingTools = createMcpPendingTools(walletService, createAuthenticatedHandler);

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

    // Register pending transaction tools (only if confirmation is enabled)
    if (config.requireConfirmation) {
        registerTool('confirm_transaction', pendingTools.confirm_transaction);
        registerTool('cancel_transaction', pendingTools.cancel_transaction);
        registerTool('list_pending_transactions', pendingTools.list_pending_transactions);
    }

    return server;
}

/**
 * Get the wallet service shutdown handler
 * Call this to properly cleanup when shutting down
 */
export function createShutdownHandler(walletService: McpWalletService): () => Promise<void> {
    return () => walletService.close();
}
