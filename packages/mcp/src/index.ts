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
 * - Factory function for creating single-wallet MCP servers
 * - McpWalletService for wallet operations
 * - Serverless handler for serverless deployments
 */

// ===========================================
// Factory and Configuration
// ===========================================

export { createTonWalletMCP, createShutdownHandler } from './factory.js';

// ===========================================
// Serverless
// ===========================================

export { createServerlessHandler, handler } from './serverless.js';
export type { ServerlessRequest, ServerlessResponse } from './serverless.js';

// ===========================================
// Type Exports
// ===========================================

export type { IContactResolver, Contact, TonMcpConfig, NetworkConfig } from './types/index.js';

// ===========================================
// Services
// ===========================================

export { McpWalletService } from './services/McpWalletService.js';
export type {
    McpWalletServiceConfig,
    JettonInfoResult,
    TransferResult,
    SwapQuoteResult,
    TransactionInfo,
} from './services/McpWalletService.js';
