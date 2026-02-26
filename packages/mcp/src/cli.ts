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
 *   NETWORK         - Network to use (mainnet or testnet, default: mainnet)
 *   MNEMONIC        - 24-word mnemonic phrase for wallet
 *   PRIVATE_KEY     - Hex-encoded private key (alternative to MNEMONIC)
 *   WALLET_VERSION  - Wallet version (v5r1 or v4r2, default: v5r1)
 *   TONCENTER_API_KEY - API key for Toncenter (optional, for higher rate limits)
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
import type { Wallet, ApiClientConfig, WalletSigner } from '@ton/walletkit';

import { createTonWalletMCP } from './factory.js';
import type { NetworkType } from './types/config.js';

const SERVER_NAME = 'ton-mcp';

// Read configuration from environment variables
const NETWORK = (process.env.NETWORK as NetworkType) || 'mainnet';
const MNEMONIC = process.env.MNEMONIC;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
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

async function createMnemonicWallet(kit: TonWalletKit, network: Network, mnemonic: string[]): Promise<Wallet> {
    const signer = await Signer.fromMnemonic(mnemonic, { type: 'ton' });
    return createWalletFromSigner(kit, network, signer);
}

async function createPrivateKeyWallet(kit: TonWalletKit, network: Network, privateKey: string): Promise<Wallet> {
    const privateKeyStripped = privateKey.replace('0x', '');
    const signer = await Signer.fromPrivateKey(Buffer.from(privateKeyStripped, 'hex'));
    return createWalletFromSigner(kit, network, signer);
}
async function createWalletFromSigner(kit: TonWalletKit, network: Network, signer: WalletSigner): Promise<Wallet> {
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
