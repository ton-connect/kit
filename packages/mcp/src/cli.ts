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
 *
 * Environment variables:
 *   NETWORK - Network to use (mainnet or testnet, default: mainnet)
 *   MNEMONIC - 24-word mnemonic phrase for wallet (if not provided, a new wallet is created)
 *   WALLET_VERSION - Wallet version (v5r1 or v4r2, default: v5r1)
 */

import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
    TonWalletKit,
    Signer,
    WalletV5R1Adapter,
    WalletV4R2Adapter,
    MemoryStorageAdapter,
    Network,
} from '@ton/walletkit';
import type { Wallet, ApiClientConfig } from '@ton/walletkit';

import { createTonWalletMCP } from './factory.js';

const SERVER_NAME = 'ton-mcp';

// Read configuration from environment variables
const NETWORK = (process.env.NETWORK as 'mainnet' | 'testnet') || 'mainnet';
const MNEMONIC = process.env.MNEMONIC;
const WALLET_VERSION = (process.env.WALLET_VERSION as 'v5r1' | 'v4r2') || 'v5r1';
const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY;

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

async function createWalletAndServer(): Promise<{
    server: Awaited<ReturnType<typeof createTonWalletMCP>>;
    kit: TonWalletKit;
    wallet: Wallet;
}> {
    const network = NETWORK === 'mainnet' ? Network.mainnet() : Network.testnet();

    // Configure API client
    const apiConfig: ApiClientConfig = {};
    if (TONCENTER_API_KEY) {
        apiConfig.url = NETWORK === 'mainnet' ? 'https://toncenter.com' : 'https://testnet.toncenter.com';
        apiConfig.key = TONCENTER_API_KEY;
    }

    // Initialize TonWalletKit
    const kit = new TonWalletKit({
        networks: {
            [network.chainId]: { apiClient: apiConfig },
        },
        storage: new MemoryStorageAdapter(),
    });
    await kit.waitForReady();

    // Get or generate mnemonic
    let mnemonic: string[];
    if (MNEMONIC) {
        mnemonic = MNEMONIC.trim().split(/\s+/);
        if (mnemonic.length !== 24) {
            throw new Error(`Invalid mnemonic: expected 24 words, got ${mnemonic.length}`);
        }
        log('Using provided mnemonic');
    } else {
        throw new Error('MNEMONIC is required');
    }
    //  else {
    //     mnemonic = await CreateTonMnemonic();
    //     log('Generated new wallet');
    //     log('IMPORTANT: Save this mnemonic to restore your wallet:');
    //     log(`MNEMONIC="${mnemonic.join(' ')}"`);
    // }

    // Create signer and wallet adapter
    const signer = await Signer.fromMnemonic(mnemonic, { type: 'ton' });

    const walletAdapter =
        WALLET_VERSION === 'v5r1'
            ? await WalletV5R1Adapter.create(signer, {
                  client: kit.getApiClient(network),
                  network,
              })
            : await WalletV4R2Adapter.create(signer, {
                  client: kit.getApiClient(network),
                  network,
              });

    // Add wallet to kit
    let wallet = await kit.addWallet(walletAdapter);
    if (!wallet) {
        wallet = kit.getWallet(walletAdapter.getWalletId());
    }
    if (!wallet) {
        throw new Error('Failed to create wallet');
    }

    log(`Wallet address: ${wallet.getAddress()}`);
    log(`Network: ${NETWORK}`);
    log(`Version: ${WALLET_VERSION}`);

    // Create MCP server with the wallet
    const server = await createTonWalletMCP({
        wallet,
        networks: {
            mainnet: TONCENTER_API_KEY && NETWORK === 'mainnet' ? { apiKey: TONCENTER_API_KEY } : undefined,
            testnet: TONCENTER_API_KEY && NETWORK === 'testnet' ? { apiKey: TONCENTER_API_KEY } : undefined,
        },
    });

    return { server, kit, wallet };
}

async function startStdio() {
    log('Starting in stdio mode...');

    const { server, kit } = await createWalletAndServer();
    const transport = new StdioServerTransport();

    const shutdown = async () => {
        log('Shutting down...');
        await kit.close();
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

    const { server, kit } = await createWalletAndServer();

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
        await kit.close();
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
