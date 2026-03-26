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
import { z } from 'zod';

import type { IContactResolver } from './types/contacts.js';
import type { NetworkConfig } from './services/McpWalletService.js';
import { McpWalletService } from './services/McpWalletService.js';
import { WalletRegistryService } from './services/WalletRegistryService.js';
import {
    AgenticSetupSessionManager,
    ConfigBackedAgenticSetupSessionStore,
} from './services/AgenticSetupSessionManager.js';
import { AgenticOnboardingService } from './services/AgenticOnboardingService.js';
import {
    createMcpAddressTools,
    createMcpAgenticOnboardingTools,
    createMcpAgenticTools,
    createMcpBalanceTools,
    createMcpKnownJettonsTools,
    createMcpNftTools,
    createMcpSwapTools,
    createMcpTransactionTools,
    createMcpTransferTools,
    createMcpWalletManagementTools,
} from './tools/index.js';
import { createMcpDnsTools } from './tools/dns-tools.js';

const SERVER_NAME = 'ton-mcp';
const SERVER_VERSION = '0.1.0';

export interface TonMcpFactoryConfig {
    /**
     * Optional fixed wallet for backward-compatible single-wallet mode.
     * If omitted, the server runs in config-backed registry mode.
     */
    wallet?: WalletAdapter;

    /**
     * Optional wallet version.
     * If omitted, the server uses the wallet version of the wallet.
     */
    walletVersion?: 'agentic' | 'v4r2' | 'v5r1';

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

    /**
     * Optional shared session manager for agentic onboarding callback handling.
     */
    agenticSessionManager?: AgenticSetupSessionManager;
}

function extendWithWalletSelector<TSchema extends z.ZodTypeAny>(schema: TSchema) {
    if (!(schema instanceof z.ZodObject)) {
        return schema;
    }
    return schema.extend({
        walletSelector: z
            .string()
            .optional()
            .describe('Optional wallet id, name, or address. Uses the active wallet when omitted.'),
    });
}

export async function createTonWalletMCP(config: TonMcpFactoryConfig): Promise<McpServer> {
    const server = new McpServer({
        name: SERVER_NAME,
        version: SERVER_VERSION,
    });

    const registry = new WalletRegistryService(config.contacts, config.networks);
    const knownJettonsTools = createMcpKnownJettonsTools();

    // Helper to register tools with type assertion (Zod version mismatch workaround)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registerTool = (name: string, tool: { description: string; inputSchema: any; handler: any }) => {
        server.registerTool(name, { description: tool.description, inputSchema: tool.inputSchema }, tool.handler);
    };

    registerTool('get_known_jettons', knownJettonsTools.get_known_jettons);

    if (config.wallet) {
        const walletService = await McpWalletService.create({
            wallet: config.wallet,
            contacts: config.contacts,
            networks: config.networks,
        });

        const balanceTools = createMcpBalanceTools(walletService);
        const transferTools = createMcpTransferTools(walletService);
        const swapTools = createMcpSwapTools(walletService);
        const nftTools = createMcpNftTools(walletService);
        const dnsTools = createMcpDnsTools(walletService);
        const transactionTools = createMcpTransactionTools(walletService);
        const agenticTools = createMcpAgenticTools(walletService);
        const addressTools = createMcpAddressTools(walletService);

        registerTool('get_wallet', balanceTools.get_wallet);
        registerTool('get_balance', balanceTools.get_balance);
        registerTool('get_balance_by_address', addressTools.get_balance_by_address);
        registerTool('get_jetton_balance', balanceTools.get_jetton_balance);
        registerTool('get_jettons', balanceTools.get_jettons);
        registerTool('get_jettons_by_address', addressTools.get_jettons_by_address);
        registerTool('get_jetton_info', addressTools.get_jetton_info);
        // registerTool('get_jetton_wallet_address', addressTools.get_jetton_wallet_address);
        registerTool('get_transactions', balanceTools.get_transactions);
        registerTool('send_ton', transferTools.send_ton);
        registerTool('send_jetton', transferTools.send_jetton);
        registerTool('send_raw_transaction', transferTools.send_raw_transaction);
        registerTool('emulate_transaction', transferTools.emulate_transaction);
        registerTool('get_transaction_status', transactionTools.get_transaction_status);
        registerTool('get_swap_quote', swapTools.get_swap_quote);
        registerTool('get_nfts', nftTools.get_nfts);
        registerTool('get_nfts_by_address', addressTools.get_nfts_by_address);
        registerTool('get_nft', nftTools.get_nft);
        registerTool('send_nft', nftTools.send_nft);
        registerTool('resolve_dns', dnsTools.resolve_dns);
        registerTool('back_resolve_dns', dnsTools.back_resolve_dns);

        if (config.walletVersion === 'agentic') {
            registerTool('agentic_deploy_subwallet', agenticTools.deploy_agentic_subwallet);
        }

        return server;
    }

    const staticService = {} as McpWalletService;
    const balanceToolDefs = createMcpBalanceTools(staticService);
    const transferToolDefs = createMcpTransferTools(staticService);
    const swapToolDefs = createMcpSwapTools(staticService);
    const nftToolDefs = createMcpNftTools(staticService);
    const dnsToolDefs = createMcpDnsTools(staticService);
    const transactionToolDefs = createMcpTransactionTools(staticService);
    const agenticToolDefs = createMcpAgenticTools(staticService);
    const addressToolDefs = createMcpAddressTools(staticService);
    const walletManagementTools = createMcpWalletManagementTools(registry);
    const ownsAgenticSessionManager = !config.agenticSessionManager;
    const agenticSessionManager =
        config.agenticSessionManager ??
        (await AgenticSetupSessionManager.create({
            store: new ConfigBackedAgenticSetupSessionStore(),
        }));
    const originalClose = server.close.bind(server);
    server.close = async () => {
        await Promise.allSettled([
            ...(ownsAgenticSessionManager ? [agenticSessionManager.close()] : []),
            originalClose(),
        ]);
    };
    const onboarding = new AgenticOnboardingService(registry, agenticSessionManager);
    const onboardingTools = createMcpAgenticOnboardingTools(onboarding);

    const registerRegistryWalletTool = (
        name: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tool: { description: string; inputSchema: any },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createTool: (service: McpWalletService) => any,
        options?: { requiresSigning?: boolean },
    ) => {
        server.registerTool(
            name,
            {
                description: tool.description,
                inputSchema: extendWithWalletSelector(tool.inputSchema),
            },
            async (rawArgs: Record<string, unknown>) => {
                const { walletSelector, ...toolArgs } = rawArgs;
                const context = await registry.createWalletService(
                    typeof walletSelector === 'string' ? walletSelector : undefined,
                    options,
                );
                try {
                    return await createTool(context.service).handler(toolArgs);
                } finally {
                    await context.close();
                }
            },
        );
    };

    registerRegistryWalletTool(
        'get_wallet',
        balanceToolDefs.get_wallet,
        (service) => createMcpBalanceTools(service).get_wallet,
    );
    registerRegistryWalletTool(
        'get_balance',
        balanceToolDefs.get_balance,
        (service) => createMcpBalanceTools(service).get_balance,
    );
    registerRegistryWalletTool(
        'get_balance_by_address',
        addressToolDefs.get_balance_by_address,
        (service) => createMcpAddressTools(service).get_balance_by_address,
    );
    registerRegistryWalletTool(
        'get_jetton_balance',
        balanceToolDefs.get_jetton_balance,
        (service) => createMcpBalanceTools(service).get_jetton_balance,
    );
    registerRegistryWalletTool(
        'get_jettons',
        balanceToolDefs.get_jettons,
        (service) => createMcpBalanceTools(service).get_jettons,
    );
    registerRegistryWalletTool(
        'get_jettons_by_address',
        addressToolDefs.get_jettons_by_address,
        (service) => createMcpAddressTools(service).get_jettons_by_address,
    );
    registerRegistryWalletTool(
        'get_jetton_info',
        addressToolDefs.get_jetton_info,
        (service) => createMcpAddressTools(service).get_jetton_info,
    );
    // registerRegistryWalletTool(
    //     'get_jetton_wallet_address',
    //     addressToolDefs.get_jetton_wallet_address,
    //     (service) => createMcpAddressTools(service).get_jetton_wallet_address,
    // );
    registerRegistryWalletTool(
        'get_transactions',
        balanceToolDefs.get_transactions,
        (service) => createMcpBalanceTools(service).get_transactions,
    );
    registerRegistryWalletTool(
        'send_ton',
        transferToolDefs.send_ton,
        (service) => createMcpTransferTools(service).send_ton,
        { requiresSigning: true },
    );
    registerRegistryWalletTool(
        'send_jetton',
        transferToolDefs.send_jetton,
        (service) => createMcpTransferTools(service).send_jetton,
        { requiresSigning: true },
    );
    registerRegistryWalletTool(
        'send_raw_transaction',
        transferToolDefs.send_raw_transaction,
        (service) => createMcpTransferTools(service).send_raw_transaction,
        { requiresSigning: true },
    );
    registerRegistryWalletTool(
        'emulate_transaction',
        transferToolDefs.emulate_transaction,
        (service) => createMcpTransferTools(service).emulate_transaction,
    );
    registerRegistryWalletTool(
        'agentic_deploy_subwallet',
        agenticToolDefs.deploy_agentic_subwallet,
        (service) => createMcpAgenticTools(service).deploy_agentic_subwallet,
        { requiresSigning: true },
    );
    registerRegistryWalletTool(
        'get_transaction_status',
        transactionToolDefs.get_transaction_status,
        (service) => createMcpTransactionTools(service).get_transaction_status,
    );
    registerRegistryWalletTool(
        'get_swap_quote',
        swapToolDefs.get_swap_quote,
        (service) => createMcpSwapTools(service).get_swap_quote,
    );
    registerRegistryWalletTool('get_nfts', nftToolDefs.get_nfts, (service) => createMcpNftTools(service).get_nfts);
    registerRegistryWalletTool(
        'get_nfts_by_address',
        addressToolDefs.get_nfts_by_address,
        (service) => createMcpAddressTools(service).get_nfts_by_address,
    );
    registerRegistryWalletTool('get_nft', nftToolDefs.get_nft, (service) => createMcpNftTools(service).get_nft);
    registerRegistryWalletTool('send_nft', nftToolDefs.send_nft, (service) => createMcpNftTools(service).send_nft, {
        requiresSigning: true,
    });
    registerRegistryWalletTool(
        'resolve_dns',
        dnsToolDefs.resolve_dns,
        (service) => createMcpDnsTools(service).resolve_dns,
    );
    registerRegistryWalletTool(
        'back_resolve_dns',
        dnsToolDefs.back_resolve_dns,
        (service) => createMcpDnsTools(service).back_resolve_dns,
    );
    // registerRegistryWalletTool(
    //     'agentic_deploy_subwallet',
    //     agenticToolDefs.deploy_agentic_subwallet,
    //     (service) => createMcpAgenticTools(service).deploy_agentic_subwallet,
    // );

    registerTool('list_wallets', walletManagementTools.list_wallets);
    registerTool('get_current_wallet', walletManagementTools.get_current_wallet);
    registerTool('set_active_wallet', walletManagementTools.set_active_wallet);
    registerTool('remove_wallet', walletManagementTools.remove_wallet);
    // registerTool('get_network_config', walletManagementTools.get_network_config);
    registerTool('agentic_validate_wallet', walletManagementTools.validate_agentic_wallet);
    registerTool('agentic_list_wallets_by_owner', walletManagementTools.list_agentic_wallets_by_owner);
    registerTool('agentic_import_wallet', walletManagementTools.import_agentic_wallet);
    registerTool('agentic_rotate_operator_key', walletManagementTools.rotate_operator_key);
    registerTool(
        'agentic_list_pending_operator_key_rotations',
        walletManagementTools.list_pending_operator_key_rotations,
    );
    registerTool('agentic_get_pending_operator_key_rotation', walletManagementTools.get_pending_operator_key_rotation);
    registerTool('agentic_complete_rotate_operator_key', walletManagementTools.complete_rotate_operator_key);
    registerTool('agentic_cancel_rotate_operator_key', walletManagementTools.cancel_rotate_operator_key);

    registerTool('agentic_start_root_wallet_setup', onboardingTools.start_agentic_root_wallet_setup);
    registerTool('agentic_list_pending_root_wallet_setups', onboardingTools.list_pending_agentic_root_wallet_setups);
    registerTool('agentic_get_root_wallet_setup', onboardingTools.get_agentic_root_wallet_setup);
    registerTool('agentic_complete_root_wallet_setup', onboardingTools.complete_agentic_root_wallet_setup);
    registerTool('agentic_cancel_root_wallet_setup', onboardingTools.cancel_agentic_root_wallet_setup);

    return server;
}

export function createShutdownHandler(walletService: McpWalletService): () => Promise<void> {
    return () => walletService.close();
}
