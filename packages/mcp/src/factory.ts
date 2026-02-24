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
import type { WalletAdapter } from '@ton/walletkit';

import type { IContactResolver } from './types/contacts.js';
import type { NetworkConfig } from './services/McpWalletService.js';
import { McpWalletService } from './services/McpWalletService.js';
import { createMcpBalanceTools, createMcpTransferTools, createMcpSwapTools, createMcpNftTools } from './tools/index.js';
import { createMcpKnownJettonsTools } from './tools/known-jettons-tools.js';
import { createMcpDnsTools } from './tools/dns-tools.js';

const SERVER_NAME = 'ton-mcp';
const SERVER_VERSION = '0.1.0';

/**
 * Configuration for createTonWalletMCP factory
 */
export interface TonMcpFactoryConfig {
    /**
     * Wallet instance to use for operations.
     * Required.
     */
    wallet: WalletAdapter;

    /**
     * Optional contact resolver for name-to-address resolution.
     */
    contacts?: IContactResolver;

    /**
     * Network-specific configuration (API keys).
     */
    networks?: {
        mainnet?: NetworkConfig;
        testnet?: NetworkConfig;
    };
}

/**
 * Create a configured TON Wallet MCP server
 *
 * @param config - Configuration with wallet instance
 * @returns Configured McpServer instance
 *
 * @example
 * ```typescript
 * import { createTonWalletMCP } from '@ton/mcp';
 * import { Signer, WalletV5R1Adapter, TonWalletKit, Network } from '@ton/walletkit';
 *
 * // Create wallet adapter
 * const kit = new TonWalletKit({ ... });
 * const signer = await Signer.fromMnemonic(mnemonic, { type: 'ton' });
 * const walletAdapter = await WalletV5R1Adapter.create(signer, {
 *   client: kit.getApiClient(Network.mainnet()),
 *   network: Network.mainnet(),
 * });
 * const wallet = await kit.addWallet(walletAdapter);
 *
 * // Create MCP server
 * const server = createTonWalletMCP({ wallet });
 * ```
 */
export async function createTonWalletMCP(config: TonMcpFactoryConfig): Promise<McpServer> {
    // Create wallet service
    const walletService = await McpWalletService.create({
        wallet: config.wallet,
        contacts: config.contacts,
        networks: config.networks,
    });

    // Create MCP server
    const server = new McpServer({
        name: SERVER_NAME,
        version: SERVER_VERSION,
    });

    // Get all tools
    const balanceTools = createMcpBalanceTools(walletService);
    const transferTools = createMcpTransferTools(walletService);
    const swapTools = createMcpSwapTools(walletService);
    const knownJettonsTools = createMcpKnownJettonsTools();
    const nftTools = createMcpNftTools(walletService);
    const dnsTools = createMcpDnsTools(walletService);

    // Helper to register tools with type assertion (Zod version mismatch workaround)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registerTool = (name: string, tool: { description: string; inputSchema: any; handler: any }) => {
        server.registerTool(name, { description: tool.description, inputSchema: tool.inputSchema }, tool.handler);
    };

    // Register wallet info tools
    registerTool('get_wallet', balanceTools.get_wallet);

    // Register balance tools
    registerTool('get_balance', balanceTools.get_balance);
    registerTool('get_jetton_balance', balanceTools.get_jetton_balance);
    registerTool('get_jettons', balanceTools.get_jettons);
    registerTool('get_transactions', balanceTools.get_transactions);

    // Register transfer tools
    registerTool('send_ton', transferTools.send_ton);
    registerTool('send_jetton', transferTools.send_jetton);
    registerTool('send_raw_transaction', transferTools.send_raw_transaction);

    // Register swap tools
    registerTool('get_swap_quote', swapTools.get_swap_quote);

    // Register known jettons tools
    registerTool('get_known_jettons', knownJettonsTools.get_known_jettons);

    // Register NFT tools
    registerTool('get_nfts', nftTools.get_nfts);
    registerTool('get_nft', nftTools.get_nft);
    registerTool('send_nft', nftTools.send_nft);

    // Register DNS tools
    registerTool('resolve_dns', dnsTools.resolve_dns);
    registerTool('back_resolve_dns', dnsTools.back_resolve_dns);

    return server;
}

/**
 * Get the wallet service shutdown handler
 * Call this to properly cleanup when shutting down
 */
export function createShutdownHandler(walletService: McpWalletService): () => Promise<void> {
    return () => walletService.close();
}
