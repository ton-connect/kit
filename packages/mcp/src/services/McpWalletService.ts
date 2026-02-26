/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * McpWalletService - Simplified wallet service for MCP server
 *
 * This service wraps a single Wallet instance for operations.
 * Wallet management (create/import/list/remove) is handled externally.
 *
 * For multi-user scenarios (e.g., Telegram bots), use this service
 * with user-specific wallet instances.
 */

import { TonWalletKit, MemoryStorageAdapter, Network, wrapWalletInterface } from '@ton/walletkit';
import type {
    Wallet,
    SwapQuoteParams,
    SwapParams,
    ApiClientConfig,
    WalletAdapter,
    TransactionRequest,
} from '@ton/walletkit';
import { OmnistonSwapProvider } from '@ton/walletkit/swap/omniston';

import type { IContactResolver } from '../types/contacts.js';
import type { NetworkType } from '../types/config.js';

/**
 * Jetton information
 */
export interface JettonInfoResult {
    address: string;
    balance: string;
    name?: string;
    symbol?: string;
    decimals?: number;
}

/**
 * NFT information
 */
export interface NftInfoResult {
    address: string;
    name?: string;
    description?: string;
    image?: string;
    collection?: {
        address: string;
        name?: string;
    };
    attributes?: Array<{
        trait_type?: string;
        value?: string;
    }>;
    ownerAddress?: string;
    isOnSale?: boolean;
    isSoulbound?: boolean;
    saleContractAddress?: string;
}

/**
 * Transaction info (from events API)
 */
export interface TransactionInfo {
    eventId: string;
    timestamp: number;
    type:
        | 'TonTransfer'
        | 'JettonTransfer'
        | 'JettonSwap'
        | 'NftItemTransfer'
        | 'ContractDeploy'
        | 'SmartContractExec'
        | 'Unknown';
    status: 'success' | 'failure';
    // For TON transfers
    from?: string;
    to?: string;
    amount?: string;
    comment?: string;
    // For Jetton transfers
    jettonAddress?: string;
    jettonSymbol?: string;
    jettonAmount?: string;
    // For swaps
    dex?: string;
    amountIn?: string;
    amountOut?: string;
    // General
    description?: string;
    isScam: boolean;
}

/**
 * Transfer result
 */
export interface TransferResult {
    success: boolean;
    message: string;
}

/**
 * Swap quote result with transaction params
 */
export interface SwapQuoteResult {
    fromToken: string;
    toToken: string;
    /** Amount to swap from in human-readable format (e.g., "1.5") */
    fromAmount: string;
    /** Amount to receive in human-readable format (e.g., "2.3") */
    toAmount: string;
    /** Minimum amount to receive after slippage in human-readable format */
    minReceived: string;
    provider: string;
    expiresAt?: number;
    /** Raw transaction params ready to send */
    transaction: {
        messages: Array<{
            address: string;
            amount: string;
            stateInit?: string;
            payload?: string;
        }>;
        validUntil?: number;
    };
}

/**
 * Network configuration with optional API key
 */
export interface NetworkConfig {
    /** TonCenter API key for this network */
    apiKey?: string;
}

/**
 * Configuration for McpWalletService
 */
export interface McpWalletServiceConfig {
    wallet: WalletAdapter;
    contacts?: IContactResolver;
    /** Network-specific configuration */
    networks?: {
        mainnet?: NetworkConfig;
        testnet?: NetworkConfig;
    };
}

interface McpWalletServiceInternalConfig {
    wallet: Wallet;
    contacts?: IContactResolver;
    /** Network-specific configuration */
    networks?: {
        mainnet?: NetworkConfig;
        testnet?: NetworkConfig;
    };
}

/**
 * McpWalletService manages wallet operations for a single wallet.
 */
export class McpWalletService {
    private readonly config: McpWalletServiceConfig;
    private readonly wallet: Wallet;
    private kit: TonWalletKit | null = null;

    private constructor(config: McpWalletServiceInternalConfig) {
        this.config = config;
        this.wallet = config.wallet;
    }

    static async create(config: McpWalletServiceConfig): Promise<McpWalletService> {
        const wallet = await wrapWalletInterface(config.wallet);
        return new McpWalletService({ ...config, wallet });
    }

    /**
     * Get wallet address
     */
    getAddress(): string {
        return this.wallet.getAddress();
    }

    /**
     * Get wallet network
     */
    getNetwork(): NetworkType {
        const network = this.wallet.getNetwork();
        return network.chainId === Network.mainnet().chainId
            ? 'mainnet'
            : Network.tetra().chainId
              ? 'tetra'
              : 'testnet';
    }

    /**
     * Initialize TonWalletKit (for swap operations)
     */
    private async getKit(): Promise<TonWalletKit> {
        if (!this.kit) {
            // Build network config with optional API keys
            const mainnetConfig: ApiClientConfig = {};
            const testnetConfig: ApiClientConfig = {};

            if (this.config.networks?.mainnet?.apiKey) {
                mainnetConfig.url = 'https://toncenter.com';
                mainnetConfig.key = this.config.networks.mainnet.apiKey;
            }
            if (this.config.networks?.testnet?.apiKey) {
                testnetConfig.url = 'https://testnet.toncenter.com';
                testnetConfig.key = this.config.networks.testnet.apiKey;
            }

            this.kit = new TonWalletKit({
                networks: {
                    [Network.mainnet().chainId]: { apiClient: mainnetConfig },
                    [Network.testnet().chainId]: { apiClient: testnetConfig },
                },
                storage: new MemoryStorageAdapter(),
            });
            await this.kit.waitForReady();

            // Register Omniston swap provider
            const omnistonProvider = new OmnistonSwapProvider({
                defaultSlippageBps: 100,
            });
            this.kit.swap.registerProvider(omnistonProvider);
        }
        return this.kit;
    }

    /**
     * Get TON balance
     */
    async getBalance(): Promise<string> {
        return this.wallet.getBalance();
    }

    /**
     * Get Jetton balance
     */
    async getJettonBalance(jettonAddress: string): Promise<string> {
        return this.wallet.getJettonBalance(jettonAddress);
    }

    /**
     * Get all Jettons
     */
    async getJettons(): Promise<JettonInfoResult[]> {
        const jettonsResponse = await this.wallet.getJettons({ pagination: { limit: 100, offset: 0 } });

        return jettonsResponse.jettons.map((j) => ({
            address: j.address,
            balance: j.balance,
            name: j.info.name,
            symbol: j.info.symbol,
            decimals: j.decimalsNumber,
        }));
    }

    /**
     * Get transaction history using events API
     */
    async getTransactions(limit: number = 20): Promise<TransactionInfo[]> {
        const address = this.wallet.getAddress();
        const client = this.wallet.getClient();

        const response = await client.getEvents({
            account: address,
            limit,
        });

        const results: TransactionInfo[] = [];

        for (const event of response.events) {
            for (const action of event.actions) {
                const info: TransactionInfo = {
                    eventId: event.eventId,
                    timestamp: event.timestamp,
                    type: 'Unknown',
                    status: action.status === 'success' ? 'success' : 'failure',
                    description: action.simplePreview?.description,
                    isScam: event.isScam,
                };

                if (action.type === 'TonTransfer' && 'TonTransfer' in action) {
                    const transfer = (
                        action as {
                            TonTransfer: {
                                sender: { address: string };
                                recipient: { address: string };
                                amount: bigint;
                                comment?: string;
                            };
                        }
                    ).TonTransfer;
                    info.type = 'TonTransfer';
                    info.from = transfer.sender?.address;
                    info.to = transfer.recipient?.address;
                    info.amount = transfer.amount?.toString();
                    info.comment = transfer.comment;
                } else if (action.type === 'JettonTransfer' && 'JettonTransfer' in action) {
                    const transfer = (
                        action as {
                            JettonTransfer: {
                                sender: { address: string };
                                recipient: { address: string };
                                amount: bigint;
                                comment?: string;
                                jetton: { address: string; symbol: string };
                            };
                        }
                    ).JettonTransfer;
                    info.type = 'JettonTransfer';
                    info.from = transfer.sender?.address;
                    info.to = transfer.recipient?.address;
                    info.jettonAmount = transfer.amount?.toString();
                    info.jettonAddress = transfer.jetton?.address;
                    info.jettonSymbol = transfer.jetton?.symbol;
                    info.comment = transfer.comment;
                } else if (action.type === 'JettonSwap' && 'JettonSwap' in action) {
                    const swap = (
                        action as {
                            JettonSwap: {
                                dex: string;
                                amountIn: string;
                                amountOut: string;
                                jettonMasterOut: { symbol: string };
                            };
                        }
                    ).JettonSwap;
                    info.type = 'JettonSwap';
                    info.dex = swap.dex;
                    info.amountIn = swap.amountIn;
                    info.amountOut = swap.amountOut;
                    info.jettonSymbol = swap.jettonMasterOut?.symbol;
                } else if (action.type === 'NftItemTransfer') {
                    info.type = 'NftItemTransfer';
                } else if (action.type === 'ContractDeploy') {
                    info.type = 'ContractDeploy';
                } else if (action.type === 'SmartContractExec') {
                    info.type = 'SmartContractExec';
                }

                results.push(info);
            }
        }

        return results;
    }

    /**
     * Send TON
     */
    async sendTon(toAddress: string, amountNano: string, comment?: string): Promise<TransferResult> {
        try {
            const tx = await this.wallet.createTransferTonTransaction({
                recipientAddress: toAddress,
                transferAmount: amountNano,
                comment,
            });

            await this.wallet.sendTransaction(tx);

            return {
                success: true,
                message: `Successfully sent ${amountNano} nanoTON to ${toAddress}`,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Send Jetton
     */
    async sendJetton(
        toAddress: string,
        jettonAddress: string,
        amountRaw: string,
        comment?: string,
    ): Promise<TransferResult> {
        try {
            const tx = await this.wallet.createTransferJettonTransaction({
                recipientAddress: toAddress,
                jettonAddress,
                transferAmount: amountRaw,
                comment,
            });

            await this.wallet.sendTransaction(tx);

            return {
                success: true,
                message: `Successfully sent jettons to ${toAddress}`,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Send a raw transaction request directly
     */
    async sendRawTransaction(request: {
        messages: Array<{
            address: string;
            amount: string;
            mode?: number;
            stateInit?: string;
            payload?: string;
        }>;
        validUntil?: number;
        fromAddress?: string;
    }): Promise<TransferResult> {
        try {
            await this.wallet.sendTransaction(request as TransactionRequest);

            return {
                success: true,
                message: `Successfully sent transaction with ${request.messages.length} message(s)`,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Get swap quote with transaction params ready to execute
     * @param fromToken Token to swap from ("TON" or jetton address)
     * @param toToken Token to swap to ("TON" or jetton address)
     * @param amount Amount to swap in human-readable format (e.g., "1.5" for 1.5 TON)
     * @param slippageBps Slippage tolerance in basis points (default 100 = 1%)
     */
    async getSwapQuote(
        fromToken: string,
        toToken: string,
        amount: string,
        slippageBps?: number,
    ): Promise<SwapQuoteResult> {
        const network = this.wallet.getNetwork();
        const kit = await this.getKit();

        // Get decimals for tokens (TON has 9 decimals, jettons need to be fetched)
        const getDecimals = async (token: string): Promise<number> => {
            if (token === 'TON' || token === 'ton') {
                return 9;
            }
            const jettonInfo = await kit.jettons.getJettonInfo(token, network);
            return jettonInfo?.decimals ?? 9;
        };

        const [fromDecimals, toDecimals] = await Promise.all([getDecimals(fromToken), getDecimals(toToken)]);

        const params: SwapQuoteParams = {
            from: { address: fromToken === 'TON' ? 'ton' : fromToken, decimals: fromDecimals },
            to: { address: toToken === 'TON' ? 'ton' : toToken, decimals: toDecimals },
            amount: amount,
            network,
            slippageBps,
        };

        const quote = await kit.swap.getQuote(params);

        // Build transaction params
        const swapParams: SwapParams = {
            quote,
            userAddress: this.wallet.getAddress(),
        };
        const tx = await kit.swap.buildSwapTransaction(swapParams);

        return {
            fromToken: quote.fromToken.address === 'ton' ? 'TON' : quote.fromToken.address,
            toToken: quote.toToken.address === 'ton' ? 'TON' : quote.toToken.address,
            fromAmount: quote.fromAmount,
            toAmount: quote.toAmount,
            minReceived: quote.minReceived,
            provider: quote.providerId,
            expiresAt: quote.expiresAt,
            transaction: {
                messages: tx.messages.map((m) => ({
                    address: m.address,
                    amount: m.amount.toString(),
                    stateInit: m.stateInit,
                    payload: m.payload,
                })),
                validUntil: tx.validUntil,
            },
        };
    }

    /**
     * Get all NFTs
     */
    async getNfts(limit: number = 20, offset: number = 0): Promise<NftInfoResult[]> {
        const nftsResponse = await this.wallet.getNfts({ pagination: { limit, offset } });

        return nftsResponse.nfts.map((nft) => ({
            address: nft.address,
            name: nft.info?.name,
            description: nft.info?.description,
            image: typeof nft.info?.image === 'string' ? nft.info.image : nft.info?.image?.url,
            collection: nft.collection
                ? {
                      address: nft.collection.address,
                      name: nft.collection.name,
                  }
                : undefined,
            attributes: nft.attributes?.map((attr) => ({
                trait_type: attr.traitType,
                value: attr.value,
            })),
            ownerAddress: nft.ownerAddress,
            isOnSale: nft.isOnSale,
            isSoulbound: nft.isSoulbound,
            saleContractAddress: nft.saleContractAddress,
        }));
    }

    /**
     * Get a specific NFT by address
     */
    async getNft(nftAddress: string): Promise<NftInfoResult | null> {
        const nft = await this.wallet.getNft(nftAddress);

        if (!nft) {
            return null;
        }

        return {
            address: nft.address,
            name: nft.info?.name,
            description: nft.info?.description,
            image: typeof nft.info?.image === 'string' ? nft.info.image : nft.info?.image?.url,
            collection: nft.collection
                ? {
                      address: nft.collection.address,
                      name: nft.collection.name,
                  }
                : undefined,
            attributes: nft.attributes?.map((attr) => ({
                trait_type: attr.traitType,
                value: attr.value,
            })),
            ownerAddress: nft.ownerAddress,
            isOnSale: nft.isOnSale,
            isSoulbound: nft.isSoulbound,
            saleContractAddress: nft.saleContractAddress,
        };
    }

    /**
     * Send NFT
     */
    async sendNft(nftAddress: string, toAddress: string, comment?: string): Promise<TransferResult> {
        try {
            const tx = await this.wallet.createTransferNftTransaction({
                nftAddress,
                recipientAddress: toAddress,
                comment,
            });

            await this.wallet.sendTransaction(tx);

            return {
                success: true,
                message: `Successfully sent NFT ${nftAddress} to ${toAddress}`,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Resolve contact name to address
     */
    async resolveContact(name: string): Promise<string | null> {
        if (!this.config.contacts) {
            return null;
        }
        return this.config.contacts.resolve('default', name);
    }

    /**
     * Resolve a TON DNS domain (e.g., "wallet.ton") to a wallet address
     */
    async resolveDns(domain: string): Promise<string | null> {
        const client = this.wallet.getClient();
        return client.resolveDnsWallet(domain);
    }

    /**
     * Reverse resolve a wallet address to a TON DNS domain
     */
    async backResolveDns(address: string): Promise<string | null> {
        const client = this.wallet.getClient();
        return client.backResolveDnsWallet(address);
    }

    /**
     * Close and cleanup
     */
    async close(): Promise<void> {
        if (this.kit) {
            await this.kit.close();
            this.kit = null;
        }
    }
}
