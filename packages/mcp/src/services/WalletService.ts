/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * WalletService - Core wallet operations using TonWalletKit
 */

import {
    TonWalletKit,
    Signer,
    WalletV5R1Adapter,
    WalletV4R2Adapter,
    CreateTonMnemonic,
    MemoryStorageAdapter,
    Network,
    createWalletId,
} from '@ton/walletkit';
import type { Wallet, SwapQuote, SwapQuoteParams, SwapParams } from '@ton/walletkit';
import { OmnistonSwapProvider } from '@ton/walletkit/swap/omniston';

import { SecureStorage } from '../storage/SecureStorage.js';
import type { WalletData } from '../storage/SecureStorage.js';

export interface CreateWalletResult {
    name: string;
    address: string;
    mnemonic: string[];
    network: 'mainnet' | 'testnet';
}

export interface ImportWalletResult {
    name: string;
    address: string;
    network: 'mainnet' | 'testnet';
}

export interface WalletInfo {
    name: string;
    address: string;
    network: 'mainnet' | 'testnet';
    version: 'v5r1' | 'v4r2';
    createdAt: string;
}

export interface JettonInfoResult {
    address: string;
    balance: string;
    name?: string;
    symbol?: string;
    decimals?: number;
}

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

export interface TransferResult {
    success: boolean;
    message: string;
}

export interface SwapQuoteResult {
    quote: SwapQuote;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    minReceived: string;
    provider: string;
    expiresAt?: number;
}

export interface SwapResult {
    success: boolean;
    message: string;
}

/**
 * WalletService manages TON wallets using TonWalletKit
 * Supports both mainnet and testnet simultaneously
 */
export class WalletService {
    private storage: SecureStorage;
    private kit: TonWalletKit | null = null;
    private loadedWallets: Map<string, Wallet> = new Map();

    constructor() {
        this.storage = new SecureStorage();
    }

    /**
     * Get Network instance from network name
     */
    private getNetwork(networkName: 'mainnet' | 'testnet'): Network {
        return networkName === 'mainnet' ? Network.mainnet() : Network.testnet();
    }

    /**
     * Initialize the TonWalletKit instance (supports both networks)
     */
    private async getKit(): Promise<TonWalletKit> {
        if (!this.kit) {
            this.kit = new TonWalletKit({
                networks: {
                    [Network.mainnet().chainId]: {},
                    [Network.testnet().chainId]: {},
                },
                storage: new MemoryStorageAdapter(),
            });
            await this.kit.waitForReady();

            // Register Omniston swap provider
            const omnistonProvider = new OmnistonSwapProvider({
                defaultSlippageBps: 100, // 1%
            });
            this.kit.swap.registerProvider('omniston', omnistonProvider);
            this.kit.swap.setDefaultProvider('omniston');
        }
        return this.kit;
    }

    /**
     * Create a new wallet with generated mnemonic
     */
    async createWallet(
        name: string,
        version: 'v5r1' | 'v4r2' = 'v5r1',
        networkName: 'mainnet' | 'testnet' = 'mainnet',
    ): Promise<CreateWalletResult> {
        const kit = await this.getKit();
        const network = this.getNetwork(networkName);

        // Generate new mnemonic
        const mnemonic = await CreateTonMnemonic();

        // Create signer from mnemonic
        const signer = await Signer.fromMnemonic(mnemonic, { type: 'ton' });

        // Create wallet adapter based on version
        const walletAdapter =
            version === 'v5r1'
                ? await WalletV5R1Adapter.create(signer, {
                      client: kit.getApiClient(network),
                      network,
                  })
                : await WalletV4R2Adapter.create(signer, {
                      client: kit.getApiClient(network),
                      network,
                  });

        const address = walletAdapter.getAddress();

        // Store wallet data
        const walletData: WalletData = {
            name,
            address,
            mnemonic,
            network: networkName,
            version,
            createdAt: new Date().toISOString(),
        };

        await this.storage.addWallet(walletData);

        // Add to kit and cache using walletId
        const wallet = await kit.addWallet(walletAdapter);
        if (wallet) {
            this.loadedWallets.set(wallet.getWalletId(), wallet);
        }

        return {
            name,
            address,
            mnemonic,
            network: walletData.network,
        };
    }

    /**
     * Import a wallet from mnemonic
     */
    async importWallet(
        name: string,
        mnemonic: string[],
        version: 'v5r1' | 'v4r2' = 'v5r1',
        networkName: 'mainnet' | 'testnet' = 'mainnet',
    ): Promise<ImportWalletResult> {
        const kit = await this.getKit();
        const network = this.getNetwork(networkName);

        // Create signer from mnemonic
        const signer = await Signer.fromMnemonic(mnemonic, { type: 'ton' });

        // Create wallet adapter based on version
        const walletAdapter =
            version === 'v5r1'
                ? await WalletV5R1Adapter.create(signer, {
                      client: kit.getApiClient(network),
                      network,
                  })
                : await WalletV4R2Adapter.create(signer, {
                      client: kit.getApiClient(network),
                      network,
                  });

        const address = walletAdapter.getAddress();

        // Store wallet data
        const walletData: WalletData = {
            name,
            address,
            mnemonic,
            network: networkName,
            version,
            createdAt: new Date().toISOString(),
        };

        await this.storage.addWallet(walletData);

        // Add to kit and cache using walletId
        const wallet = await kit.addWallet(walletAdapter);
        if (wallet) {
            this.loadedWallets.set(wallet.getWalletId(), wallet);
        }

        return {
            name,
            address,
            network: walletData.network,
        };
    }

    /**
     * List all stored wallets
     */
    async listWallets(): Promise<WalletInfo[]> {
        const wallets = await this.storage.getWallets();
        return wallets.map((w) => ({
            name: w.name,
            address: w.address,
            network: w.network,
            version: w.version,
            createdAt: w.createdAt,
        }));
    }

    /**
     * Remove a wallet by name
     */
    async removeWallet(name: string): Promise<boolean> {
        const walletData = await this.storage.getWallet(name);
        if (!walletData) {
            return false;
        }

        const network = this.getNetwork(walletData.network);
        const walletId = createWalletId(network, walletData.address);

        // Remove from cache
        this.loadedWallets.delete(walletId);

        // Remove from kit if loaded
        if (this.kit) {
            const kitWallet = this.kit.getWallet(walletId);
            if (kitWallet) {
                await this.kit.removeWallet(walletId);
            }
        }

        return this.storage.removeWallet(name);
    }

    /**
     * Get or load a wallet by name
     */
    private async getWalletByName(name: string): Promise<Wallet> {
        const walletData = await this.storage.getWallet(name);
        if (!walletData) {
            throw new Error(`Wallet "${name}" not found`);
        }

        const network = this.getNetwork(walletData.network);
        const walletId = createWalletId(network, walletData.address);

        // Check cache first
        if (this.loadedWallets.has(walletId)) {
            return this.loadedWallets.get(walletId)!;
        }

        // Load wallet into kit
        const kit = await this.getKit();
        const signer = await Signer.fromMnemonic(walletData.mnemonic, { type: 'ton' });

        const walletAdapter =
            walletData.version === 'v5r1'
                ? await WalletV5R1Adapter.create(signer, {
                      client: kit.getApiClient(network),
                      network,
                  })
                : await WalletV4R2Adapter.create(signer, {
                      client: kit.getApiClient(network),
                      network,
                  });

        const wallet = await kit.addWallet(walletAdapter);
        if (!wallet) {
            // Wallet already exists in kit
            const existingWallet = kit.getWallet(walletId);
            if (existingWallet) {
                this.loadedWallets.set(walletId, existingWallet);
                return existingWallet;
            }
            throw new Error(`Failed to load wallet "${name}"`);
        }

        this.loadedWallets.set(walletId, wallet);
        return wallet;
    }

    /**
     * Get TON balance for a wallet
     */
    async getBalance(walletName: string): Promise<string> {
        const wallet = await this.getWalletByName(walletName);
        const balance = await wallet.getBalance();
        return balance;
    }

    /**
     * Get Jetton balance for a wallet
     */
    async getJettonBalance(walletName: string, jettonAddress: string): Promise<string> {
        const wallet = await this.getWalletByName(walletName);
        const balance = await wallet.getJettonBalance(jettonAddress);
        return balance;
    }

    /**
     * Get all Jettons for a wallet
     */
    async getJettons(walletName: string): Promise<JettonInfoResult[]> {
        const wallet = await this.getWalletByName(walletName);
        const jettonsResponse = await wallet.getJettons({ pagination: { limit: 100, offset: 0 } });

        const results: JettonInfoResult[] = [];

        for (const j of jettonsResponse.jettons) {
            results.push({
                address: j.address,
                balance: j.balance,
                name: j.info.name,
                symbol: j.info.symbol,
                decimals: j.decimalsNumber,
            });
        }

        return results;
    }

    /**
     * Get transaction history for a wallet using events API (like demo wallet)
     */
    async getTransactions(walletName: string, limit: number = 20): Promise<TransactionInfo[]> {
        const wallet = await this.getWalletByName(walletName);
        const address = wallet.getAddress();
        const client = wallet.getClient();

        const response = await client.getEvents({
            account: address,
            limit,
        });

        const results: TransactionInfo[] = [];

        for (const event of response.events) {
            // Process each action in the event
            for (const action of event.actions) {
                const info: TransactionInfo = {
                    eventId: event.eventId,
                    timestamp: event.timestamp,
                    type: 'Unknown',
                    status: action.status === 'success' ? 'success' : 'failure',
                    description: action.simplePreview?.description,
                    isScam: event.isScam,
                };

                // Handle different action types
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
     * Send TON to an address
     */
    async sendTon(walletName: string, toAddress: string, amount: string, comment?: string): Promise<TransferResult> {
        try {
            const wallet = await this.getWalletByName(walletName);

            const tx = await wallet.createTransferTonTransaction({
                recipientAddress: toAddress,
                transferAmount: amount,
                comment,
            });

            await wallet.sendTransaction(tx);

            return {
                success: true,
                message: `Successfully sent ${amount} nanoTON to ${toAddress}`,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Send Jetton to an address
     */
    async sendJetton(
        walletName: string,
        toAddress: string,
        jettonAddress: string,
        amount: string,
        comment?: string,
    ): Promise<TransferResult> {
        try {
            const wallet = await this.getWalletByName(walletName);

            const tx = await wallet.createTransferJettonTransaction({
                recipientAddress: toAddress,
                jettonAddress,
                transferAmount: amount,
                comment,
            });

            await wallet.sendTransaction(tx);

            return {
                success: true,
                message: `Successfully sent ${amount} jettons to ${toAddress}`,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Get a swap quote
     */
    async getSwapQuote(
        walletName: string,
        fromToken: string,
        toToken: string,
        amount: string,
        slippageBps?: number,
    ): Promise<SwapQuoteResult> {
        // Verify wallet exists and get its network
        const walletData = await this.storage.getWallet(walletName);
        if (!walletData) {
            throw new Error(`Wallet "${walletName}" not found`);
        }

        const network = this.getNetwork(walletData.network);
        const kit = await this.getKit();

        const params: SwapQuoteParams = {
            fromToken: fromToken === 'TON' ? 'TON' : fromToken,
            toToken: toToken === 'TON' ? 'TON' : toToken,
            amountFrom: amount,
            network,
            slippageBps,
        };

        const quote = await kit.swap.getQuote(params);

        return {
            quote,
            fromToken: typeof quote.fromToken === 'string' ? quote.fromToken : quote.fromToken,
            toToken: typeof quote.toToken === 'string' ? quote.toToken : quote.toToken,
            fromAmount: quote.fromAmount,
            toAmount: quote.toAmount,
            minReceived: quote.minReceived,
            provider: quote.provider,
            expiresAt: quote.expiresAt,
        };
    }

    /**
     * Execute a swap using a quote
     */
    async executeSwap(walletName: string, quote: SwapQuote): Promise<SwapResult> {
        try {
            const [wallet, kit, walletData] = await Promise.all([
                this.getWalletByName(walletName),
                this.getKit(),
                this.storage.getWallet(walletName),
            ]);

            if (!walletData) {
                throw new Error(`Wallet "${walletName}" not found`);
            }

            const params: SwapParams = {
                quote,
                userAddress: walletData.address,
            };

            const tx = await kit.swap.buildSwapTransaction(params);

            await wallet.sendTransaction(tx);

            return {
                success: true,
                message: `Successfully swapped ${quote.fromAmount} ${quote.fromToken} for ${quote.toAmount} ${quote.toToken}`,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Close the service and cleanup
     */
    async close(): Promise<void> {
        if (this.kit) {
            await this.kit.close();
            this.kit = null;
        }
        this.loadedWallets.clear();
    }
}
