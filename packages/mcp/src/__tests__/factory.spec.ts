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

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Network, Signer } from '@ton/walletkit';
import type { WalletAdapter } from '@ton/walletkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    createMcpWalletServiceFromStoredWallet: vi.fn(),
    deriveStandardWalletAddress: vi.fn(),
}));

vi.mock('../runtime/wallet-runtime.js', () => ({
    createMcpWalletServiceFromStoredWallet: mocks.createMcpWalletServiceFromStoredWallet,
    deriveStandardWalletAddress: mocks.deriveStandardWalletAddress,
}));

import { createStandardWalletRecord, createEmptyConfig } from '../registry/config.js';
import { saveConfig } from '../registry/config-persistence.js';
import { AgenticWalletAdapter } from '../contracts/agentic_wallet/AgenticWalletAdapter.js';
import { createTonWalletMCP } from '../factory.js';
import { createApiClient } from '../utils/ton-client.js';

function parseToolResult(result: Awaited<ReturnType<Client['callTool']>>) {
    const first = result.content[0];
    if (!first || first.type !== 'text') {
        throw new Error('Expected text tool response');
    }
    return JSON.parse(first.text) as Record<string, unknown>;
}

describe('createTonWalletMCP registry mode', () => {
    const firstAddress = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
    const secondAddress = 'EQDSLOFVamNZzdy4LulclcCBEFkRReZ7WscBCLAw3Pg53kAk';
    const originalConfigPath = process.env.TON_CONFIG_PATH;
    let tempDir = '';

    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'ton-mcp-factory-'));
        process.env.TON_CONFIG_PATH = join(tempDir, 'config.json');
        delete process.env.TONCENTER_API_KEY;
        mocks.createMcpWalletServiceFromStoredWallet.mockReset();
        mocks.deriveStandardWalletAddress.mockReset();
    });

    afterEach(() => {
        if (originalConfigPath) {
            process.env.TON_CONFIG_PATH = originalConfigPath;
        } else {
            delete process.env.TON_CONFIG_PATH;
        }
        rmSync(tempDir, { recursive: true, force: true });
    });

    it('registers wallet-management, onboarding, and wrapped wallet tools over the MCP protocol', async () => {
        const server = await createTonWalletMCP({});
        const client = new Client({ name: 'mcp-test', version: '1.0.0' });
        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

        await server.connect(serverTransport);
        await client.connect(clientTransport);

        try {
            const tools = await client.listTools();
            const names = tools.tools.map((tool) => tool.name);

            expect(names).toContain('list_wallets');
            expect(names).toContain('get_current_wallet');
            expect(names).not.toContain('set_network_config');
            expect(names).toContain('agentic_start_root_wallet_setup');
            expect(names).toContain('agentic_rotate_operator_key');
            expect(names).toContain('agentic_complete_rotate_operator_key');
            expect(names).not.toContain('reset_wallet_config');
            expect(names).toContain('get_balance');

            const getBalance = tools.tools.find((tool) => tool.name === 'get_balance');
            const listWallets = tools.tools.find((tool) => tool.name === 'list_wallets');
            expect(getBalance?.inputSchema.properties).toHaveProperty('walletSelector');
            expect(listWallets?.inputSchema.properties ?? {}).not.toHaveProperty('walletSelector');
        } finally {
            await client.close();
            await server.close();
        }
    });

    it('invokes wrapped wallet tools with active wallet and explicit walletSelector', async () => {
        const first = createStandardWalletRecord({
            name: 'Primary',
            network: 'mainnet',
            walletVersion: 'v5r1',
            address: firstAddress,
        });
        const second = createStandardWalletRecord({
            name: 'Secondary',
            network: 'testnet',
            walletVersion: 'v4r2',
            address: secondAddress,
        });
        saveConfig({
            ...createEmptyConfig(),
            active_wallet_id: first.id,
            wallets: [first, second],
        });

        const closeContext = vi.fn();
        mocks.createMcpWalletServiceFromStoredWallet.mockImplementation(async ({ wallet }) => ({
            service: {
                getAddress: () => wallet.address,
                getNetwork: () => wallet.network,
                getBalance: async () => '2000000000',
                close: closeContext,
            },
            close: closeContext,
        }));

        const server = await createTonWalletMCP({});
        const client = new Client({ name: 'mcp-test', version: '1.0.0' });
        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

        await server.connect(serverTransport);
        await client.connect(clientTransport);

        try {
            const activeWallet = parseToolResult(await client.callTool({ name: 'get_wallet', arguments: {} }));
            expect(activeWallet).toMatchObject({
                success: true,
                address: first.address,
                network: 'mainnet',
            });

            const selectedWallet = parseToolResult(
                await client.callTool({
                    name: 'get_wallet',
                    arguments: {
                        walletSelector: second.id,
                    },
                }),
            );
            expect(selectedWallet).toMatchObject({
                success: true,
                address: second.address,
                network: 'testnet',
            });

            const balance = parseToolResult(
                await client.callTool({
                    name: 'get_balance',
                    arguments: {
                        walletSelector: second.id,
                    },
                }),
            );
            expect(balance).toMatchObject({
                success: true,
                address: second.address,
                balanceNano: '2000000000',
            });
            expect(closeContext).toHaveBeenCalledTimes(3);
        } finally {
            await client.close();
            await server.close();
        }
    });

    it('returns a clean tool error when no active wallet is configured', async () => {
        saveConfig(createEmptyConfig());
        const server = await createTonWalletMCP({});
        const client = new Client({ name: 'mcp-test', version: '1.0.0' });
        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

        await server.connect(serverTransport);
        await client.connect(clientTransport);

        try {
            const result = await client.callTool({
                name: 'get_balance',
                arguments: {},
            });

            expect(result.isError).toBe(true);
            expect(String(result.content[0]?.type)).toBe('text');
            expect(String(result.content[0] && 'text' in result.content[0] ? result.content[0].text : '')).toContain(
                'No active wallet configured',
            );
        } finally {
            await client.close();
            await server.close();
        }
    });

    it('supports registry and onboarding flows over MCP', async () => {
        const server = await createTonWalletMCP({});
        const client = new Client({ name: 'mcp-test', version: '1.0.0' });
        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

        await server.connect(serverTransport);
        await client.connect(clientTransport);

        try {
            const started = parseToolResult(
                await client.callTool({
                    name: 'agentic_start_root_wallet_setup',
                    arguments: {
                        network: 'mainnet',
                        name: 'Agent Alpha',
                        source: 'Factory test',
                    },
                }),
            );
            expect(started.success).toBe(true);
            expect(typeof started.setupId).toBe('string');
            expect(String(started.dashboardUrl)).toContain('/create?');
            expect(String(started.callbackUrl)).toContain('/agentic/callback/');
            expect(started.pendingDeployment).toMatchObject({
                has_private_key: true,
            });
            expect(started.pendingDeployment).not.toHaveProperty('private_key');

            const pending = parseToolResult(
                await client.callTool({
                    name: 'agentic_list_pending_root_wallet_setups',
                    arguments: {},
                }),
            );
            expect(pending).toMatchObject({
                success: true,
                count: 1,
            });
            expect(pending.setups[0]?.pendingDeployment).toMatchObject({
                has_private_key: true,
            });
            expect(pending.setups[0]?.pendingDeployment).not.toHaveProperty('private_key');
        } finally {
            await client.close();
            await server.close();
        }
    });

    it('sanitizes stored wallet and network secrets in management tools', async () => {
        const server = await createTonWalletMCP({});
        const wallet = createStandardWalletRecord({
            name: 'Primary',
            network: 'mainnet',
            walletVersion: 'v5r1',
            address: firstAddress,
        });
        saveConfig(
            {
                ...createEmptyConfig(),
                active_wallet_id: wallet.id,
                wallets: [wallet],
                networks: {
                    mainnet: {
                        toncenter_api_key: 'super-secret-key',
                    },
                },
            },
            { wallets: { [wallet.id]: { mnemonic: 'abandon '.repeat(23) + 'about' } } },
        );

        const client = new Client({ name: 'mcp-test', version: '1.0.0' });
        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

        await server.connect(serverTransport);
        await client.connect(clientTransport);

        try {
            const listed = parseToolResult(await client.callTool({ name: 'list_wallets', arguments: {} }));
            const current = parseToolResult(await client.callTool({ name: 'get_current_wallet', arguments: {} }));
            // const network = parseToolResult(
            //     await client.callTool({ name: 'get_network_config', arguments: { network: 'mainnet' } }),
            // );

            expect(listed.wallets[0]).toMatchObject({
                id: wallet.id,
                has_mnemonic: true,
                has_private_key: false,
            });
            expect(listed.wallets[0]).not.toHaveProperty('mnemonic');
            expect(listed.wallets[0]).not.toHaveProperty('private_key');

            expect(current.wallet).toMatchObject({
                id: wallet.id,
                has_mnemonic: true,
                has_private_key: false,
            });
            expect(current.wallet).not.toHaveProperty('mnemonic');
            expect(current.wallet).not.toHaveProperty('private_key');
        } finally {
            await client.close();
            await server.close();
        }
    });

    it('passes runtime network overrides to registry-backed wallet services', async () => {
        const first = createStandardWalletRecord({
            name: 'Primary',
            network: 'mainnet',
            walletVersion: 'v5r1',
            address: firstAddress,
        });
        saveConfig(
            {
                ...createEmptyConfig(),
                active_wallet_id: first.id,
                wallets: [first],
            },
            { wallets: { [first.id]: { mnemonic: 'abandon '.repeat(23) + 'about' } } },
        );

        const closeContext = vi.fn();
        mocks.createMcpWalletServiceFromStoredWallet.mockImplementation(async ({ wallet }) => ({
            service: {
                getAddress: () => wallet.address,
                getNetwork: () => wallet.network,
                close: closeContext,
            },
            close: closeContext,
        }));

        const server = await createTonWalletMCP({
            networks: {
                mainnet: {
                    apiKey: 'override-key',
                },
            },
        });
        const client = new Client({ name: 'mcp-test', version: '1.0.0' });
        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

        await server.connect(serverTransport);
        await client.connect(clientTransport);

        try {
            const result = parseToolResult(await client.callTool({ name: 'get_wallet', arguments: {} }));
            expect(result.success).toBe(true);
            expect(mocks.createMcpWalletServiceFromStoredWallet).toHaveBeenCalledWith(
                expect.objectContaining({
                    toncenterApiKey: 'override-key',
                }),
            );
        } finally {
            await client.close();
            await server.close();
        }
    });

    it('rejects write tools for agentic wallets without operator key in registry mode', async () => {
        saveConfig({
            ...createEmptyConfig(),
            active_wallet_id: 'agent-1',
            wallets: [
                {
                    id: 'agent-1',
                    type: 'agentic',
                    name: 'Read-only agent',
                    network: 'mainnet',
                    address: secondAddress,
                    owner_address: firstAddress,
                    created_at: '2026-03-10T00:00:00.000Z',
                    updated_at: '2026-03-10T00:00:00.000Z',
                },
            ],
        });

        const server = await createTonWalletMCP({});
        const client = new Client({ name: 'mcp-test', version: '1.0.0' });
        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

        await server.connect(serverTransport);
        await client.connect(clientTransport);

        try {
            const result = await client.callTool({
                name: 'send_ton',
                arguments: {
                    toAddress: firstAddress,
                    amount: '0.1',
                },
            });
            expect(result.isError).toBe(true);
            const text = result.content[0] && 'text' in result.content[0] ? result.content[0].text : '';
            expect(text).toContain('private_key');
            expect(mocks.createMcpWalletServiceFromStoredWallet).not.toHaveBeenCalled();
        } finally {
            await client.close();
            await server.close();
        }
    });
});

describe('createTonWalletMCP single-wallet mode', () => {
    it('registers agentic tools when walletVersion is agentic', async () => {
        const signer = await Signer.fromPrivateKey(Buffer.alloc(32, 9));
        const clientApi = createApiClient('mainnet');
        const adapter = await AgenticWalletAdapter.create(signer, {
            client: clientApi,
            network: Network.mainnet(),
            walletAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        });
        const server = await createTonWalletMCP({ wallet: adapter as unknown as WalletAdapter, walletVersion: 'agentic' });
        const client = new Client({ name: 'mcp-test', version: '1.0.0' });
        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

        await server.connect(serverTransport);
        await client.connect(clientTransport);

        try {
            const tools = await client.listTools();
            const names = tools.tools.map((tool) => tool.name);
            expect(names).toContain('agentic_deploy_subwallet');
        } finally {
            await client.close();
            await server.close();
        }
    });
});
