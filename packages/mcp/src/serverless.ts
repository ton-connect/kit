/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * TON MCP Serverless Handler
 *
 * Provides a simple serverless-compatible function for MCP operations.
 * Credentials are extracted from request headers.
 *
 * Headers:
 *   - MNEMONIC: 24-word mnemonic phrase
 *   - PRIVATE_KEY: Hex-encoded private key (takes priority over MNEMONIC)
 *   - NETWORK: Network to use (mainnet or testnet, default: mainnet)
 *   - TONCENTER_KEY: Optional TonCenter API key
 */

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { TonWalletKit, Signer, WalletV5R1Adapter, MemoryStorageAdapter, Network } from '@ton/walletkit';
import type { Wallet, ApiClientConfig, WalletSigner } from '@ton/walletkit';

import { createTonWalletMCP } from './factory.js';

export interface ServerlessRequest {
    headers: Record<string, string | string[] | undefined>;
    method?: string;
    url?: string;
    body?: unknown;
}

export interface ServerlessResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}

interface ParsedCredentials {
    mnemonic?: string[];
    privateKey?: Buffer;
    network: 'mainnet' | 'testnet';
    toncenterKey?: string;
}

function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
    const value = headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()];
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}

function parseCredentials(headers: Record<string, string | string[] | undefined>): ParsedCredentials | null {
    const privateKeyHex = getHeader(headers, 'PRIVATE_KEY') || getHeader(headers, 'private-key');
    const mnemonicStr = getHeader(headers, 'MNEMONIC') || getHeader(headers, 'mnemonic');
    const networkStr = getHeader(headers, 'NETWORK') || getHeader(headers, 'network');
    const toncenterKey = getHeader(headers, 'TONCENTER_KEY') || getHeader(headers, 'toncenter-key');

    // PRIVATE_KEY has priority over MNEMONIC
    let privateKey: Buffer | undefined;
    let mnemonic: string[] | undefined;

    if (privateKeyHex) {
        privateKey = Buffer.from(privateKeyHex, 'hex');
        if (privateKey.length !== 32 && privateKey.length !== 64) {
            return null;
        }
        // Use only first 32 bytes if 64 bytes provided (full keypair)
        if (privateKey.length === 64) {
            privateKey = privateKey.subarray(0, 32);
        }
    } else if (mnemonicStr) {
        mnemonic = mnemonicStr.trim().split(/\s+/);
        if (mnemonic.length !== 24) {
            return null;
        }
    } else {
        // No credentials provided
        return null;
    }

    const network = (networkStr === 'testnet' ? 'testnet' : 'mainnet') as 'mainnet' | 'testnet';

    return {
        mnemonic,
        privateKey,
        network,
        toncenterKey,
    };
}

async function createWalletFromCredentials(credentials: ParsedCredentials): Promise<{
    wallet: Wallet;
    kit: TonWalletKit;
}> {
    const network = credentials.network === 'mainnet' ? Network.mainnet() : Network.testnet();

    const apiConfig: ApiClientConfig = {};
    if (credentials.toncenterKey) {
        apiConfig.url = credentials.network === 'mainnet' ? 'https://toncenter.com' : 'https://testnet.toncenter.com';
        apiConfig.key = credentials.toncenterKey;
    }

    const kit = new TonWalletKit({
        networks: {
            [network.chainId]: { apiClient: apiConfig },
        },
        storage: new MemoryStorageAdapter(),
    });
    await kit.waitForReady();

    let signer: WalletSigner;
    if (credentials.privateKey) {
        signer = await Signer.fromPrivateKey(credentials.privateKey);
    } else if (credentials.mnemonic) {
        signer = await Signer.fromMnemonic(credentials.mnemonic, { type: 'ton' });
    } else {
        throw new Error('No valid credentials');
    }

    const walletAdapter = await WalletV5R1Adapter.create(signer, {
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

    return { wallet, kit };
}

/**
 * Create a serverless handler for MCP requests
 *
 * @example
 * ```typescript
 * // AWS Lambda
 * import { createServerlessHandler } from '@ton/mcp/serverless';
 * export const handler = createServerlessHandler();
 *
 * // Vercel
 * import { createServerlessHandler } from '@ton/mcp/serverless';
 * export default createServerlessHandler();
 * ```
 */
export function createServerlessHandler() {
    return async (req: ServerlessRequest): Promise<ServerlessResponse> => {
        const credentials = parseCredentials(req.headers);

        if (!credentials) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: 'Forbidden',
                    message: 'Missing or invalid credentials. Provide PRIVATE_KEY or MNEMONIC header.',
                }),
            };
        }

        let kit: TonWalletKit | null = null;

        try {
            const { wallet, kit: walletKit } = await createWalletFromCredentials(credentials);
            kit = walletKit;

            const server = await createTonWalletMCP({
                wallet,
                networks: {
                    mainnet:
                        credentials.toncenterKey && credentials.network === 'mainnet'
                            ? { apiKey: credentials.toncenterKey }
                            : undefined,
                    testnet:
                        credentials.toncenterKey && credentials.network === 'testnet'
                            ? { apiKey: credentials.toncenterKey }
                            : undefined,
                },
            });

            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => crypto.randomUUID(),
            });

            await server.connect(transport);

            // Create mock request/response for transport
            const responseChunks: Buffer[] = [];
            const mockRes = {
                writeHead: () => mockRes,
                write: (chunk: Buffer | string) => {
                    responseChunks.push(Buffer.from(chunk));
                    return true;
                },
                end: (chunk?: Buffer | string) => {
                    if (chunk) {
                        responseChunks.push(Buffer.from(chunk));
                    }
                },
                setHeader: () => mockRes,
                getHeader: () => undefined,
                on: () => mockRes,
            };

            const mockReq = {
                method: req.method || 'POST',
                url: req.url || '/mcp',
                headers: req.headers,
                on: (event: string, handler: (data?: unknown) => void) => {
                    if (event === 'data' && req.body) {
                        handler(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
                    }
                    if (event === 'end') {
                        handler();
                    }
                    return mockReq;
                },
            };

            await transport.handleRequest(mockReq as never, mockRes as never);

            const responseBody = Buffer.concat(responseChunks).toString('utf-8');

            await transport.close();
            await kit.close();

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: responseBody,
            };
        } catch (error) {
            if (kit) {
                await kit.close();
            }

            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: 'Internal Server Error',
                    message: error instanceof Error ? error.message : 'Unknown error',
                }),
            };
        }
    };
}

/**
 * Default serverless handler
 */
export const handler = createServerlessHandler();
