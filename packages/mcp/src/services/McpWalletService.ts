/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * McpWalletService - Multi-user wallet service with adapter support
 *
 * This service wraps wallet operations with:
 * - User isolation via UserScopedSigner and UserScopedStorage
 * - Transaction limits via LimitsManager
 * - Confirmation flow via PendingTransactionManager
 *
 * Unlike the standalone WalletService, this service is designed for
 * multi-user environments like Telegram bots.
 */

import {
    TonWalletKit,
    Signer,
    WalletV5R1Adapter,
    WalletV4R2Adapter,
    MemoryStorageAdapter,
    Network,
    createWalletId,
} from '@ton/walletkit';
import type { Wallet, SwapQuote, SwapQuoteParams, SwapParams, ApiClientConfig } from '@ton/walletkit';
import { OmnistonSwapProvider } from '@ton/walletkit/swap/omniston';

import type { LimitsConfig } from '../types/config.js';
import type { IStorageAdapter } from '../types/storage.js';
import type { ISignerAdapter } from '../types/signer.js';
import type { IContactResolver } from '../types/contacts.js';
import { UserScopedStorage } from '../core/UserScopedStorage.js';
import { UserScopedSigner } from '../core/UserScopedSigner.js';
import { LimitsManager } from '../core/LimitsManager.js';
import { PendingTransactionManager } from '../core/PendingTransactionManager.js';
import type {
    PendingTransaction,
    PendingTonTransfer,
    PendingJettonTransfer,
    PendingSwap,
} from '../core/PendingTransactionManager.js';

/**
 * Wallet info returned to tools (no sensitive data)
 */
export interface McpWalletInfo {
    name: string;
    address: string;
    network: 'mainnet' | 'testnet';
    version: 'v5r1' | 'v4r2';
    createdAt: string;
}

/**
 * Result of creating a wallet (no mnemonic!)
 */
export interface CreateWalletResult {
    name: string;
    address: string;
    network: 'mainnet' | 'testnet';
}

/**
 * Result of importing a wallet
 */
export interface ImportWalletResult {
    name: string;
    address: string;
    network: 'mainnet' | 'testnet';
}

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
    pendingTransactionId?: string;
}

/**
 * Swap quote result
 */
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

/**
 * Swap result
 */
export interface SwapResult {
    success: boolean;
    message: string;
    pendingTransactionId?: string;
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
    storage: IStorageAdapter;
    signer: ISignerAdapter;
    contacts?: IContactResolver;
    defaultNetwork?: 'mainnet' | 'testnet';
    limits?: LimitsConfig;
    requireConfirmation?: boolean;
    /** Network-specific configuration */
    networks?: {
        mainnet?: NetworkConfig;
        testnet?: NetworkConfig;
    };
}

/**
 * McpWalletService manages wallet operations for multi-user MCP deployments.
 */
export class McpWalletService {
    private readonly config: McpWalletServiceConfig;
    private readonly limitsManager: LimitsManager;
    private readonly pendingManager: PendingTransactionManager;
    private kit: TonWalletKit | null = null;
    private loadedWallets: Map<string, Wallet> = new Map();

    constructor(config: McpWalletServiceConfig) {
        this.config = config;
        this.limitsManager = new LimitsManager(config.limits);
        this.pendingManager = new PendingTransactionManager();
    }

    /**
     * Get Network instance from network name
     */
    private getNetwork(networkName: 'mainnet' | 'testnet'): Network {
        return networkName === 'mainnet' ? Network.mainnet() : Network.testnet();
    }

    /**
     * Initialize TonWalletKit
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
            this.kit.swap.registerProvider('omniston', omnistonProvider);
            this.kit.swap.setDefaultProvider('omniston');
        }
        return this.kit;
    }

    /**
     * Create user-scoped storage wrapper
     */
    createUserStorage(userId: string): UserScopedStorage {
        return new UserScopedStorage(this.config.storage, userId);
    }

    /**
     * Create user-scoped signer wrapper
     */
    createUserSigner(userId: string): UserScopedSigner {
        return new UserScopedSigner(this.config.signer, userId);
    }

    /**
     * Get limits manager
     */
    getLimitsManager(): LimitsManager {
        return this.limitsManager;
    }

    /**
     * Get pending transaction manager
     */
    getPendingManager(): PendingTransactionManager {
        return this.pendingManager;
    }

    /**
     * Check if confirmation is required
     */
    requiresConfirmation(): boolean {
        return this.config.requireConfirmation ?? false;
    }

    /**
     * Create a new wallet for a user
     */
    async createWallet(
        userSigner: UserScopedSigner,
        userStorage: UserScopedStorage,
        name: string,
        version: 'v5r1' | 'v4r2' = 'v5r1',
        networkName: 'mainnet' | 'testnet' = this.config.defaultNetwork ?? 'mainnet',
    ): Promise<CreateWalletResult> {
        // Check wallet count limit
        const existingWallets = await userSigner.listWallets();
        const limitCheck = await this.limitsManager.checkWalletCountLimit(existingWallets.length);
        if (!limitCheck.allowed) {
            throw new Error(limitCheck.reason);
        }

        // Create wallet via signer
        const walletInfo = await userSigner.createWallet({
            name,
            version,
            network: networkName,
        });

        // Store metadata in user storage
        const metadata: McpWalletInfo = {
            name: walletInfo.name,
            address: walletInfo.address,
            network: walletInfo.network,
            version: walletInfo.version,
            createdAt: walletInfo.createdAt,
        };
        await userStorage.set(`wallet:${name}`, metadata);

        // Return result WITHOUT mnemonic
        return {
            name: walletInfo.name,
            address: walletInfo.address,
            network: walletInfo.network,
        };
    }

    /**
     * Import a wallet for a user
     */
    async importWallet(
        userSigner: UserScopedSigner,
        userStorage: UserScopedStorage,
        name: string,
        mnemonic: string[],
        version: 'v5r1' | 'v4r2' = 'v5r1',
        networkName: 'mainnet' | 'testnet' = this.config.defaultNetwork ?? 'mainnet',
    ): Promise<ImportWalletResult> {
        // Check wallet count limit
        const existingWallets = await userSigner.listWallets();
        const limitCheck = await this.limitsManager.checkWalletCountLimit(existingWallets.length);
        if (!limitCheck.allowed) {
            throw new Error(limitCheck.reason);
        }

        // Import wallet via signer (mnemonic stored securely, never returned)
        const walletInfo = await userSigner.importWallet({
            name,
            mnemonic,
            version,
            network: networkName,
        });

        // Store metadata in user storage
        const metadata: McpWalletInfo = {
            name: walletInfo.name,
            address: walletInfo.address,
            network: walletInfo.network,
            version: walletInfo.version,
            createdAt: walletInfo.createdAt,
        };
        await userStorage.set(`wallet:${name}`, metadata);

        return {
            name: walletInfo.name,
            address: walletInfo.address,
            network: walletInfo.network,
        };
    }

    /**
     * List all wallets for a user
     */
    async listWallets(userSigner: UserScopedSigner): Promise<McpWalletInfo[]> {
        const wallets = await userSigner.listWallets();
        return wallets.map((w) => ({
            name: w.name,
            address: w.address,
            network: w.network,
            version: w.version,
            createdAt: w.createdAt,
        }));
    }

    /**
     * Remove a wallet for a user
     */
    async removeWallet(userSigner: UserScopedSigner, userStorage: UserScopedStorage, name: string): Promise<boolean> {
        // Delete from signer
        const deleted = await userSigner.deleteWallet(name);
        if (deleted) {
            // Delete metadata
            await userStorage.delete(`wallet:${name}`);
        }
        return deleted;
    }

    /**
     * Get or load a wallet for balance/transfer operations
     */
    private async getWalletForOperations(userSigner: UserScopedSigner, name: string): Promise<Wallet> {
        const walletInfo = await userSigner.getWallet(name);
        if (!walletInfo) {
            throw new Error('Wallet not found');
        }

        const network = this.getNetwork(walletInfo.network);
        const walletId = createWalletId(network, walletInfo.address);

        // Check cache
        if (this.loadedWallets.has(walletId)) {
            return this.loadedWallets.get(walletId)!;
        }

        // We need to load the wallet into TonWalletKit
        // This requires access to the mnemonic, which is stored in the signer
        // The LocalSignerAdapter has a method to get the loaded wallet
        const signer = userSigner.getUnderlyingSigner() as {
            getLoadedWallet?(walletId: string): Promise<Wallet>;
            getStoredWallet?(walletId: string):
                | {
                      mnemonic: string[];
                      version: 'v5r1' | 'v4r2';
                  }
                | undefined;
        };

        // Try to get loaded wallet from signer
        if (typeof signer.getLoadedWallet === 'function') {
            const scopedId = `${userSigner.getUserId()}:${name}`;
            const wallet = await signer.getLoadedWallet(scopedId);
            this.loadedWallets.set(walletId, wallet);
            return wallet;
        }

        // Fallback: need to reconstruct the wallet
        // This requires the mnemonic from the signer
        if (typeof signer.getStoredWallet === 'function') {
            const scopedId = `${userSigner.getUserId()}:${name}`;
            const storedWallet = signer.getStoredWallet(scopedId);
            if (storedWallet) {
                const kit = await this.getKit();
                const signerInstance = await Signer.fromMnemonic(storedWallet.mnemonic, { type: 'ton' });

                const walletAdapter =
                    storedWallet.version === 'v5r1'
                        ? await WalletV5R1Adapter.create(signerInstance, {
                              client: kit.getApiClient(network),
                              network,
                          })
                        : await WalletV4R2Adapter.create(signerInstance, {
                              client: kit.getApiClient(network),
                              network,
                          });

                let wallet = await kit.addWallet(walletAdapter);
                if (!wallet) {
                    wallet = kit.getWallet(walletId);
                }
                if (!wallet) {
                    throw new Error('Failed to load wallet');
                }

                this.loadedWallets.set(walletId, wallet);
                return wallet;
            }
        }

        throw new Error('Unable to load wallet for operations');
    }

    /**
     * Get TON balance
     */
    async getBalance(userSigner: UserScopedSigner, walletName: string): Promise<string> {
        const wallet = await this.getWalletForOperations(userSigner, walletName);
        return wallet.getBalance();
    }

    /**
     * Get Jetton balance
     */
    async getJettonBalance(userSigner: UserScopedSigner, walletName: string, jettonAddress: string): Promise<string> {
        const wallet = await this.getWalletForOperations(userSigner, walletName);
        return wallet.getJettonBalance(jettonAddress);
    }

    /**
     * Get all Jettons
     */
    async getJettons(userSigner: UserScopedSigner, walletName: string): Promise<JettonInfoResult[]> {
        const wallet = await this.getWalletForOperations(userSigner, walletName);
        const jettonsResponse = await wallet.getJettons({ pagination: { limit: 100, offset: 0 } });

        return jettonsResponse.jettons.map((j) => ({
            address: j.address,
            balance: j.balance,
            name: j.info.name,
            symbol: j.info.symbol,
            decimals: j.decimalsNumber,
        }));
    }

    /**
     * Get transaction history for a wallet
     */
    /**
     * Get transaction history using events API (like demo wallet)
     */
    async getTransactions(
        userSigner: UserScopedSigner,
        walletName: string,
        limit: number = 20,
    ): Promise<TransactionInfo[]> {
        const wallet = await this.getWalletForOperations(userSigner, walletName);
        const address = wallet.getAddress();
        const client = wallet.getClient();

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
     * Send TON (with optional confirmation flow)
     */
    async sendTon(
        userSigner: UserScopedSigner,
        userStorage: UserScopedStorage,
        walletName: string,
        toAddress: string,
        amountNano: string,
        amountTon: string,
        comment?: string,
    ): Promise<TransferResult> {
        // Check limits
        const limitCheck = await this.limitsManager.checkTransactionLimit(userStorage, parseFloat(amountTon));
        if (!limitCheck.allowed) {
            return { success: false, message: limitCheck.reason! };
        }

        // If confirmation required, create pending transaction
        if (this.requiresConfirmation()) {
            const pending = await this.pendingManager.createPending(userStorage, {
                type: 'send_ton',
                walletName,
                description: `Send ${amountTon} TON to ${toAddress}${comment ? ` (${comment})` : ''}`,
                data: {
                    type: 'send_ton',
                    toAddress,
                    amountNano,
                    amountTon,
                    comment,
                } as PendingTonTransfer,
            });

            return {
                success: true,
                message: `Transaction pending confirmation. ID: ${pending.id}`,
                pendingTransactionId: pending.id,
            };
        }

        // Execute immediately
        return this.executeTonTransfer(userSigner, userStorage, walletName, toAddress, amountNano, comment);
    }

    /**
     * Execute TON transfer (internal)
     */
    async executeTonTransfer(
        userSigner: UserScopedSigner,
        userStorage: UserScopedStorage,
        walletName: string,
        toAddress: string,
        amountNano: string,
        comment?: string,
    ): Promise<TransferResult> {
        try {
            const wallet = await this.getWalletForOperations(userSigner, walletName);

            const tx = await wallet.createTransferTonTransaction({
                recipientAddress: toAddress,
                transferAmount: amountNano,
                comment,
            });

            await wallet.sendTransaction(tx);

            // Record for daily limit
            const amountTon = Number(BigInt(amountNano)) / 1e9;
            await this.limitsManager.recordTransaction(userStorage, amountTon);

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
     * Send Jetton (with optional confirmation flow)
     */
    async sendJetton(
        userSigner: UserScopedSigner,
        userStorage: UserScopedStorage,
        walletName: string,
        toAddress: string,
        jettonAddress: string,
        amountRaw: string,
        amountHuman: string,
        symbol: string | undefined,
        decimals: number,
        comment?: string,
    ): Promise<TransferResult> {
        // If confirmation required, create pending transaction
        if (this.requiresConfirmation()) {
            const pending = await this.pendingManager.createPending(userStorage, {
                type: 'send_jetton',
                walletName,
                description: `Send ${amountHuman} ${symbol ?? 'tokens'} to ${toAddress}${comment ? ` (${comment})` : ''}`,
                data: {
                    type: 'send_jetton',
                    toAddress,
                    jettonAddress,
                    amountRaw,
                    amountHuman,
                    symbol,
                    decimals,
                    comment,
                } as PendingJettonTransfer,
            });

            return {
                success: true,
                message: `Transaction pending confirmation. ID: ${pending.id}`,
                pendingTransactionId: pending.id,
            };
        }

        // Execute immediately
        return this.executeJettonTransfer(userSigner, walletName, toAddress, jettonAddress, amountRaw, comment);
    }

    /**
     * Execute Jetton transfer (internal)
     */
    async executeJettonTransfer(
        userSigner: UserScopedSigner,
        walletName: string,
        toAddress: string,
        jettonAddress: string,
        amountRaw: string,
        comment?: string,
    ): Promise<TransferResult> {
        try {
            const wallet = await this.getWalletForOperations(userSigner, walletName);

            const tx = await wallet.createTransferJettonTransaction({
                recipientAddress: toAddress,
                jettonAddress,
                transferAmount: amountRaw,
                comment,
            });

            await wallet.sendTransaction(tx);

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
     * Get swap quote
     */
    async getSwapQuote(
        userSigner: UserScopedSigner,
        walletName: string,
        fromToken: string,
        toToken: string,
        amount: string,
        slippageBps?: number,
    ): Promise<SwapQuoteResult> {
        const walletInfo = await userSigner.getWallet(walletName);
        if (!walletInfo) {
            throw new Error('Wallet not found');
        }

        const network = this.getNetwork(walletInfo.network);
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
     * Execute swap (with optional confirmation flow)
     */
    async executeSwap(
        userSigner: UserScopedSigner,
        userStorage: UserScopedStorage,
        walletName: string,
        quote: SwapQuote,
    ): Promise<SwapResult> {
        // If confirmation required, create pending transaction
        if (this.requiresConfirmation()) {
            const pending = await this.pendingManager.createPending(userStorage, {
                type: 'swap',
                walletName,
                description: `Swap ${quote.fromAmount} ${quote.fromToken} for ${quote.toAmount} ${quote.toToken}`,
                data: {
                    type: 'swap',
                    fromToken: String(quote.fromToken),
                    toToken: String(quote.toToken),
                    fromAmount: quote.fromAmount,
                    toAmount: quote.toAmount,
                    minReceived: quote.minReceived,
                    provider: quote.provider,
                    quoteJson: JSON.stringify(quote),
                } as PendingSwap,
            });

            return {
                success: true,
                message: `Swap pending confirmation. ID: ${pending.id}`,
                pendingTransactionId: pending.id,
            };
        }

        // Execute immediately
        return this.executeSwapInternal(userSigner, walletName, quote);
    }

    /**
     * Execute swap (internal)
     */
    async executeSwapInternal(userSigner: UserScopedSigner, walletName: string, quote: SwapQuote): Promise<SwapResult> {
        try {
            const [wallet, kit, walletInfo] = await Promise.all([
                this.getWalletForOperations(userSigner, walletName),
                this.getKit(),
                userSigner.getWallet(walletName),
            ]);

            if (!walletInfo) {
                throw new Error('Wallet not found');
            }

            const params: SwapParams = {
                quote,
                userAddress: walletInfo.address,
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
     * Confirm a pending transaction
     */
    async confirmTransaction(
        userSigner: UserScopedSigner,
        userStorage: UserScopedStorage,
        transactionId: string,
    ): Promise<TransferResult | SwapResult> {
        const pending = await this.pendingManager.confirmPending(userStorage, transactionId);
        if (!pending) {
            return { success: false, message: 'Transaction not found or expired' };
        }

        switch (pending.data.type) {
            case 'send_ton': {
                const data = pending.data as PendingTonTransfer;
                return this.executeTonTransfer(
                    userSigner,
                    userStorage,
                    pending.walletName,
                    data.toAddress,
                    data.amountNano,
                    data.comment,
                );
            }
            case 'send_jetton': {
                const data = pending.data as PendingJettonTransfer;
                return this.executeJettonTransfer(
                    userSigner,
                    pending.walletName,
                    data.toAddress,
                    data.jettonAddress,
                    data.amountRaw,
                    data.comment,
                );
            }
            case 'swap': {
                const data = pending.data as PendingSwap;
                const quote = JSON.parse(data.quoteJson) as SwapQuote;
                return this.executeSwapInternal(userSigner, pending.walletName, quote);
            }
            default:
                return { success: false, message: 'Unknown transaction type' };
        }
    }

    /**
     * Cancel a pending transaction
     */
    async cancelTransaction(userStorage: UserScopedStorage, transactionId: string): Promise<boolean> {
        return this.pendingManager.cancelPending(userStorage, transactionId);
    }

    /**
     * List pending transactions
     */
    async listPendingTransactions(userStorage: UserScopedStorage): Promise<PendingTransaction[]> {
        return this.pendingManager.listPending(userStorage);
    }

    /**
     * Resolve contact name to address
     */
    async resolveContact(userId: string, name: string): Promise<string | null> {
        if (!this.config.contacts) {
            return null;
        }
        return this.config.contacts.resolve(userId, name);
    }

    /**
     * Close and cleanup
     */
    async close(): Promise<void> {
        if (this.kit) {
            await this.kit.close();
            this.kit = null;
        }
        this.loadedWallets.clear();
    }
}
