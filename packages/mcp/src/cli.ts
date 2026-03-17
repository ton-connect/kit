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
 *   npx @ton/mcp@alpha                          # stdio mode (default)
 *   npx @ton/mcp@alpha --http                   # HTTP server on 0.0.0.0:3000
 *   npx @ton/mcp@alpha --http 8080              # HTTP server on custom port
 *   npx @ton/mcp@alpha --http --host 127.0.0.1  # HTTP server on custom host
 *   npx @ton/mcp@alpha get_balance              # raw CLI: call tool and exit
 *   npx @ton/mcp@alpha get_transactions --limit 5
 *   npx @ton/mcp@alpha get_jetton_balance --jettonAddress EQAbc...
 *
 * Environment variables:
 *   NETWORK         - Network to use (mainnet or testnet, default: mainnet)
 *   MNEMONIC        - 24-word mnemonic phrase for wallet
 *   PRIVATE_KEY     - Hex-encoded private key (alternative to MNEMONIC)
 *   WALLET_VERSION  - Wallet version (v5r1, v4r2, or agentic; default: v5r1)
 *   AGENTIC_WALLET_ADDRESS - Agentic wallet address (required for WALLET_VERSION=agentic unless derived from init params)
 *   AGENTIC_WALLET_NFT_INDEX - walletNftIndex / subwallet id for agentic wallet (uint256, optional)
 *   AGENTIC_COLLECTION_ADDRESS - collection address for agentic wallet state init derivation (optional)
 *   TONCENTER_API_KEY - API key for Toncenter (optional, for higher rate limits)
 *   AGENTIC_CALLBACK_BASE_URL - optional public callback base URL for agentic onboarding
 *   AGENTIC_CALLBACK_HOST - host for local callback server in stdio mode (default: 127.0.0.1)
 *   AGENTIC_CALLBACK_PORT - port for local callback server in stdio mode (default: random free port)
 */

import './suppress-punycode-deprecation.js';

import { createServer } from 'node:http';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    TonWalletKit,
    Signer,
    WalletV5R1Adapter,
    WalletV4R2Adapter,
    MemoryStorageAdapter,
    Network,
} from '@ton/walletkit';
import type { Wallet, WalletSigner } from '@ton/walletkit';

import { createTonWalletMCP } from './factory.js';
import type { NetworkType } from './types/config.js';
import { AgenticWalletAdapter } from './contracts/agentic_wallet/AgenticWalletAdapter.js';
import { createHttpMcpSessionRouter } from './http-mode.js';
import {
    AgenticSetupSessionManager,
    ConfigBackedAgenticSetupSessionStore,
} from './services/AgenticSetupSessionManager.js';
import { createApiClient } from './utils/ton-client.js';
import { parseCliArgs } from './utils/cli-args.js';
import { UINT_256_MAX } from './utils/math.js';

const SERVER_NAME = 'ton-mcp';

// Read configuration from environment variables
const NETWORK = (process.env.NETWORK as NetworkType) || 'mainnet';
const MNEMONIC = process.env.MNEMONIC;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const WALLET_VERSION = (process.env.WALLET_VERSION as 'v5r1' | 'v4r2' | 'agentic') || 'v5r1';
const AGENTIC_WALLET_ADDRESS = process.env.AGENTIC_WALLET_ADDRESS;
const AGENTIC_WALLET_NFT_INDEX = process.env.AGENTIC_WALLET_NFT_INDEX;
const DEFAULT_AGENTIC_COLLECTION_ADDRESS = 'EQByQ19qvWxW7VibSbGEgZiYMqilHY5y1a_eeSL2VaXhfy07';
const AGENTIC_COLLECTION_ADDRESS = process.env.AGENTIC_COLLECTION_ADDRESS?.trim() || DEFAULT_AGENTIC_COLLECTION_ADDRESS;
const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY;
const AGENTIC_CALLBACK_BASE_URL = process.env.AGENTIC_CALLBACK_BASE_URL?.trim();
const AGENTIC_CALLBACK_HOST = process.env.AGENTIC_CALLBACK_HOST?.trim() || '127.0.0.1';
const AGENTIC_CALLBACK_PORT = Number.parseInt(process.env.AGENTIC_CALLBACK_PORT ?? '', 10);

if (WALLET_VERSION !== 'agentic' && WALLET_VERSION !== 'v4r2' && WALLET_VERSION !== 'v5r1') {
    throw new Error(`Invalid WALLET_VERSION: "${WALLET_VERSION}". Must be one of: agentic, v4r2, v5r1`);
}

function log(message: string) {
    // eslint-disable-next-line no-console
    console.error(`[${SERVER_NAME}] ${message}`);
}

function parseArgs() {
    const args = process.argv.slice(2);
    const httpIndex = args.indexOf('--http');

    if (httpIndex !== -1) {
        const nextArg = args[httpIndex + 1];
        const port = nextArg && !nextArg.startsWith('-') ? parseInt(nextArg, 10) : 3000;

        const hostIndex = args.indexOf('--host');
        const hostArg = hostIndex !== -1 ? args[hostIndex + 1] : undefined;
        const host = hostArg && !hostArg.startsWith('-') ? hostArg : '0.0.0.0';

        return { mode: 'http' as const, port, host };
    }

    const toolName = args.find((a) => !a.startsWith('-'));
    if (toolName) {
        return { mode: 'cli' as const, toolName, rawArgs: args };
    }

    return { mode: 'stdio' as const };
}

function parseAgenticWalletNftIndex(input?: string): bigint | undefined {
    if (!input) {
        return undefined;
    }
    const value = input.trim();
    if (!value) {
        return undefined;
    }

    let parsed: bigint;
    try {
        parsed = BigInt(value);
    } catch {
        throw new Error(`Invalid AGENTIC_WALLET_NFT_INDEX: "${input}"`);
    }

    if (parsed < 0n || parsed >= UINT_256_MAX) {
        throw new Error('AGENTIC_WALLET_NFT_INDEX must be a uint256 value');
    }

    return parsed;
}

async function createMnemonicWallet(kit: TonWalletKit, network: Network, mnemonic: string[]): Promise<Wallet> {
    const signer = await Signer.fromMnemonic(mnemonic, { type: 'ton' });
    return createWalletFromSigner(kit, network, signer);
}

function parsePrivateKeyInput(privateKey: string): Buffer {
    const privateKeyStripped = privateKey.replace(/^0x/i, '').trim();
    if (!/^[0-9a-fA-F]+$/.test(privateKeyStripped)) {
        throw new Error('Invalid PRIVATE_KEY: expected hex-encoded value');
    }

    if (privateKeyStripped.length !== 64 && privateKeyStripped.length !== 128) {
        throw new Error(
            `Invalid PRIVATE_KEY: expected 32-byte (64 hex chars) or 64-byte (128 hex chars) key, got ${privateKeyStripped.length} hex chars`,
        );
    }

    const privateKeyBuffer = Buffer.from(privateKeyStripped, 'hex');
    if (privateKeyBuffer.length === 64) {
        // Some TON tooling exports secret as private||public (64 bytes). Signer expects only private seed.
        return privateKeyBuffer.subarray(0, 32);
    }

    return privateKeyBuffer;
}

async function createPrivateKeyWallet(kit: TonWalletKit, network: Network, privateKey: string): Promise<Wallet> {
    const signer = await Signer.fromPrivateKey(parsePrivateKeyInput(privateKey));
    return createWalletFromSigner(kit, network, signer);
}
async function createWalletFromSigner(kit: TonWalletKit, network: Network, signer: WalletSigner): Promise<Wallet> {
    const walletAdapter =
        WALLET_VERSION === 'v5r1'
            ? await WalletV5R1Adapter.create(signer, {
                  client: kit.getApiClient(network),
                  network,
              })
            : WALLET_VERSION === 'v4r2'
              ? await WalletV4R2Adapter.create(signer, {
                    client: kit.getApiClient(network),
                    network,
                })
              : await AgenticWalletAdapter.create(signer, {
                    client: kit.getApiClient(network),
                    network,
                    walletAddress: AGENTIC_WALLET_ADDRESS,
                    walletNftIndex: parseAgenticWalletNftIndex(AGENTIC_WALLET_NFT_INDEX),
                    collectionAddress: AGENTIC_COLLECTION_ADDRESS,
                });

    let wallet = await kit.addWallet(walletAdapter);
    if (!wallet) {
        wallet = kit.getWallet(walletAdapter.getWalletId());
    }
    if (!wallet) {
        throw new Error('Failed to create wallet');
    }

    return wallet;
}

/**
 * Create controlled wallet (MCP keypair mode)
 */
// async function createControlledWallet(kit: TonWalletKit, network: ReturnType<typeof Network.mainnet>): Promise<Wallet> {
//     let keyData = await KeyManager.loadKey();

//     if (!keyData) {
//         // No stored key, need wallet address from user or env
//         let walletAddress = WALLET_ADDRESS;

//         if (!walletAddress) {
//             log('No mnemonic provided. Running in controlled wallet mode.');
//             log('Please provide your wallet address to set up MCP control.');
//             walletAddress = await promptUser('Enter your TON wallet address: ');
//         }

//         if (!walletAddress) {
//             throw new Error('Wallet address is required for controlled wallet mode');
//         }

//         log(`Generating new keypair for wallet: ${walletAddress}`);
//         keyData = await KeyManager.generateAndStoreKey(walletAddress, NETWORK);
//         log(`Keypair stored in ${KeyManager.getKeyFilePath()}`);
//         log(`Public key: ${keyData.publicKey}`);
//         log('');
//         log('IMPORTANT: To enable MCP to control your wallet, you need to:');
//         log('1. Add this public key as an extension to your wallet contract');
//         log('2. Or use a wallet that supports delegated signing');
//     } else {
//         log(`Using stored keypair for wallet: ${keyData.walletAddress}`);
//         log(`Public key: ${keyData.publicKey}`);
//     }

//     // Create signer from stored key
//     const keyPair = KeyManager.getKeyPair(keyData);
//     const signer = await Signer.fromPrivateKey(keyPair.secretKey.slice(0, 32));

//     const walletAdapter = await WalletOwnableAdapter.create(signer, {
//         client: kit.getApiClient(network),
//         network,
//         nftInfo: {
//             itemIndex: 0n,
//             collectionAddress: Address.parse('EQC8EqPgaPlrApfYxtG0Rcz8bnU3yC1enq9DfuFbZlpEDTG5'),
//         },
//         owner: Address.parse(keyData.walletAddress ?? ''),
//     });

//     let wallet = await kit.addWallet(walletAdapter);
//     if (!wallet) {
//         wallet = kit.getWallet(walletAdapter.getWalletId());
//     }
//     if (!wallet) {
//         throw new Error('Failed to create controlled wallet');
//     }

//     return wallet;
// }

async function createWalletAndServer(agenticSessionManager?: AgenticSetupSessionManager): Promise<{
    server: Awaited<ReturnType<typeof createTonWalletMCP>>;
    kit?: TonWalletKit;
    wallet?: Wallet;
}> {
    if (!MNEMONIC && !PRIVATE_KEY) {
        // log('No direct wallet credentials provided. Starting in config-registry mode.');
        const server = await createTonWalletMCP({
            agenticSessionManager,
            walletVersion: WALLET_VERSION,
            networks: {
                mainnet: TONCENTER_API_KEY && NETWORK === 'mainnet' ? { apiKey: TONCENTER_API_KEY } : undefined,
                testnet: TONCENTER_API_KEY && NETWORK === 'testnet' ? { apiKey: TONCENTER_API_KEY } : undefined,
            },
        });
        return { server };
    }

    const networkType = NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
    const network = networkType === 'mainnet' ? Network.mainnet() : Network.testnet();

    // Initialize TonWalletKit
    const kit = new TonWalletKit({
        networks: {
            [network.chainId]: { apiClient: createApiClient(networkType, TONCENTER_API_KEY) },
        },
        storage: new MemoryStorageAdapter(),
    });
    await kit.waitForReady();

    let wallet: Wallet;

    if (MNEMONIC) {
        // Traditional mnemonic mode
        const mnemonic = MNEMONIC.trim().split(/\s+/);
        if (mnemonic.length !== 24) {
            throw new Error(`Invalid mnemonic: expected 24 words, got ${mnemonic.length}`);
        }
        log('Using provided mnemonic');
        wallet = await createMnemonicWallet(kit, network, mnemonic);
        log(`Wallet address: ${wallet.getAddress()}`);
        log(`Network: ${NETWORK}`);
        log(`Version: ${WALLET_VERSION}`);
    } else if (PRIVATE_KEY) {
        // Private key mode
        log('Using provided private key');
        wallet = await createPrivateKeyWallet(kit, network, PRIVATE_KEY.trim());
        log(`Wallet address: ${wallet.getAddress()}`);
        log(`Network: ${NETWORK}`);
        log(`Version: ${WALLET_VERSION}`);
    } else {
        throw new Error('MNEMONIC or PRIVATE_KEY is required');
        // Controlled wallet mode
        // wallet = await createControlledWallet(kit, network);
        // log(`Controlled wallet address: ${wallet.getAddress()}`);
        // log(`Network: ${NETWORK}`);
        // log('Mode: Controlled (MCP keypair)');
    }

    // Create MCP server with the wallet
    const server = await createTonWalletMCP({
        agenticSessionManager,
        wallet,
        walletVersion: WALLET_VERSION,
        networks: {
            mainnet: TONCENTER_API_KEY && NETWORK === 'mainnet' ? { apiKey: TONCENTER_API_KEY } : undefined,
            testnet: TONCENTER_API_KEY && NETWORK === 'testnet' ? { apiKey: TONCENTER_API_KEY } : undefined,
        },
    });

    return { server, kit, wallet };
}

function getResolvedHttpCallbackBaseUrl(host: string, port: number): string {
    if (AGENTIC_CALLBACK_BASE_URL) {
        return AGENTIC_CALLBACK_BASE_URL.replace(/\/+$/, '');
    }

    const publicHost = host === '0.0.0.0' ? '127.0.0.1' : host;
    return `http://${publicHost}:${port}`;
}

function createStdioSessionManager(): AgenticSetupSessionManager {
    return new AgenticSetupSessionManager({
        host: AGENTIC_CALLBACK_HOST,
        listenPort: Number.isFinite(AGENTIC_CALLBACK_PORT) ? AGENTIC_CALLBACK_PORT : 0,
        publicBaseUrl: AGENTIC_CALLBACK_BASE_URL,
        store: new ConfigBackedAgenticSetupSessionStore(),
    });
}

function createHttpSessionManager(host: string, port: number): AgenticSetupSessionManager {
    return new AgenticSetupSessionManager({
        publicBaseUrl: getResolvedHttpCallbackBaseUrl(host, port),
        enableInternalHttpServer: false,
        store: new ConfigBackedAgenticSetupSessionStore(),
    });
}

async function startCli(toolName: string, rawArgs: string[]) {
    const sessionManager = createStdioSessionManager();
    const { server, kit } = await createWalletAndServer(sessionManager);

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);

    const client = new Client({ name: 'ton-mcp-cli', version: '0.0.1' });
    await client.connect(clientTransport);

    let isError = false;
    try {
        const tools = await client.listTools();
        const toolSchema = tools.tools.find((tool) => tool.name === toolName)?.inputSchema;
        const normalizedArgs = parseCliArgs(rawArgs, toolSchema);
        const result = await client.callTool({ name: toolName, arguments: normalizedArgs }, CallToolResultSchema);
        const content = result.content as Array<{ type: string; text?: string }>;
        for (const item of content) {
            if (item.type === 'text' && item.text !== undefined) {
                process.stdout.write(item.text + '\n');
            }
        }
        isError = !!result.isError;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`[${SERVER_NAME}] Tool error:`, error instanceof Error ? error.message : error);
        isError = true;
    } finally {
        await client.close();
        await sessionManager.close();
        if (kit) {
            await kit.close();
        }
    }

    process.exit(isError ? 1 : 0);
}

async function startStdio() {
    log('Starting in stdio mode...');

    const sessionManager = createStdioSessionManager();
    const { server, kit } = await createWalletAndServer(sessionManager);
    const transport = new StdioServerTransport();

    const shutdown = async () => {
        log('Shutting down...');
        await sessionManager.close();
        if (kit) {
            await kit.close();
        }
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

    const sessionManager = createHttpSessionManager(host, port);
    const router = createHttpMcpSessionRouter({
        host,
        port,
        handleExtraRequest: (req, res) => sessionManager.handleCallbackHttpRequest(req, res),
        createServerInstance: async () => {
            const { server, kit } = await createWalletAndServer(sessionManager);
            return {
                server,
                close: async () => {
                    if (kit) {
                        await kit.close();
                    }
                },
            };
        },
    });

    const httpServer = createServer(async (req, res) => {
        await router.handleRequest(req, res);
    });

    const shutdown = async () => {
        log('Shutting down...');
        httpServer.close();
        await Promise.allSettled([router.close(), sessionManager.close()]);
        log('Shutdown complete');
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    httpServer.listen(port, host, () => {
        log(`HTTP server listening on http://${host}:${port}/mcp`);
    });
}

function fatalError(error: unknown) {
    // eslint-disable-next-line no-console
    console.error(`[${SERVER_NAME}] Fatal error:`, error);
    process.exit(1);
}

const config = parseArgs();

if (config.mode === 'http') {
    startHttp(config.port, config.host).catch(fatalError);
} else if (config.mode === 'cli') {
    startCli(config.toolName, config.rawArgs).catch(fatalError);
} else {
    startStdio().catch(fatalError);
}
