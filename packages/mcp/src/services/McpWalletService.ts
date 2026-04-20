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

import { createHash } from 'node:crypto';

import {
    TonWalletKit,
    MemoryStorageAdapter,
    Network,
    wrapWalletInterface,
    getTransactionStatus,
    formatUnits,
    getJettonsFromClient,
    getNftsFromClient,
    getJettonWalletAddressFromClient,
    HexToBase64,
    Uint8ArrayToHex,
} from '@ton/walletkit';
import type {
    Wallet,
    SwapQuoteParams,
    SwapParams,
    WalletAdapter,
    TransactionRequest,
    TransactionStatusResponse,
    ProofMessage,
} from '@ton/walletkit';
import type { OmnistonProviderOptions } from '@ton/walletkit/swap/omniston';
import { OmnistonSwapProvider } from '@ton/walletkit/swap/omniston';
import { Address, beginCell, Cell, contractAddress, Dictionary, storeStateInit } from '@ton/core';
import { SettlementMethod } from '@ston-fi/omniston-sdk';

import type { IContactResolver } from '../types/contacts.js';
import type { NetworkType } from '../types/config.js';
import { AgenticWalletCodeCell } from '../contracts/agentic_wallet/AgenticWallet.source.js';
import { createApiClient } from '../utils/ton-client.js';
import { UINT_256_MAX } from '../utils/math.js';

const OP_DEPLOY_WALLET = 0x0609e47b;
const AGENTIC_DEFAULT_VALID_UNTIL = 600;
const TEP64_ONCHAIN_CONTENT_PREFIX = 0x00;
const TEP64_SNAKE_CONTENT_PREFIX = 0x00;

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

export interface JettonMetadataResult {
    address: string;
    name?: string;
    symbol?: string;
    decimals?: number;
    description?: string;
    image?: string;
    uri?: string;
}

export interface AddressBalanceResult {
    address: string;
    balanceNano: string;
    balanceTon: string;
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
    normalizedHash?: string;
}

export interface DeployAgenticSubwalletResult extends TransferResult {
    subwalletAddress?: string;
    subwalletNftIndex?: string;
    ownerAddress?: string;
    collectionAddress?: string;
    operatorPublicKey?: string;
    amountNano?: string;
    queryId?: string;
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
 * Signed TonProof payload for third-party authentication
 */
export interface TonProofResult {
    address: string;
    chain: string;
    walletStateInit: string;
    publicKey: string;
    timestamp: number;
    domainLengthBytes: number;
    domainValue: string;
    signature: string;
    payload: string;
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

interface DeployAgenticSubwalletParams {
    operatorPublicKey: string;
    amountNano: string;
    metadata: Record<string, string | number | boolean>;
}

interface AgenticRootWalletState {
    ownerAddress: Address;
    collectionAddress: Address;
    originOperatorPublicKey: bigint;
    deployedByUser: boolean;
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

    private static parseUint256(input: string, fieldName: string): bigint {
        const value = input.trim();
        if (!value) {
            throw new Error(`${fieldName} is required`);
        }

        let parsed: bigint;
        try {
            parsed = BigInt(value);
        } catch {
            throw new Error(`${fieldName} must be a uint256 value (decimal or 0x-prefixed hex)`);
        }

        if (parsed < 0n || parsed >= UINT_256_MAX) {
            throw new Error(`${fieldName} must be in range [0, 2^256 - 1]`);
        }

        return parsed;
    }

    private static createQueryId(): bigint {
        const now = BigInt(Date.now());
        const rand = BigInt(Math.floor(Math.random() * 0xffff));
        return (now << 16n) | rand;
    }

    private static onchainMetadataKey(key: string): bigint {
        const hashHex = createHash('sha256').update(key, 'utf8').digest('hex');
        return BigInt(`0x${hashHex}`);
    }

    private static buildOnchainMetadataValue(value: string | number | boolean): Cell {
        const stringValue = typeof value === 'string' ? value : value.toString();
        return beginCell().storeUint(TEP64_SNAKE_CONTENT_PREFIX, 8).storeStringTail(stringValue).endCell();
    }

    private static buildOnchainMetadata(metadata: Record<string, string | number | boolean>): Cell {
        const dict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
        for (const [key, value] of Object.entries(metadata)) {
            dict.set(McpWalletService.onchainMetadataKey(key), McpWalletService.buildOnchainMetadataValue(value));
        }

        const metadataDictCell = beginCell().storeDictDirect(dict).endCell();
        return beginCell().storeUint(TEP64_ONCHAIN_CONTENT_PREFIX, 8).storeMaybeRef(metadataDictCell).endCell();
    }

    private static buildAgenticWalletConfigData(nftItemIndex: bigint, collectionAddress: Address): Cell {
        return beginCell()
            .storeUint(nftItemIndex, 256)
            .storeAddress(collectionAddress)
            .storeBit(true)
            .storeUint(0, 32)
            .storeDict(null)
            .storeMaybeRef(null)
            .endCell();
    }

    private static calculateAgenticWalletIndex(
        ownerAddress: Address,
        originOperatorPublicKey: bigint,
        deployedByUser: boolean,
    ): bigint {
        const seedCell = beginCell()
            .storeAddress(ownerAddress)
            .storeUint(originOperatorPublicKey, 256)
            .storeBit(deployedByUser)
            .endCell();
        return BigInt(`0x${seedCell.hash().toString('hex')}`);
    }

    private static createDeployWalletBody(
        queryId: bigint,
        walletDataCell: Cell,
        senderOriginOperatorPublicKey: bigint,
    ): Cell {
        return beginCell()
            .storeUint(OP_DEPLOY_WALLET, 32)
            .storeUint(queryId, 64)
            .storeRef(walletDataCell)
            .storeUint(senderOriginOperatorPublicKey, 256)
            .endCell();
    }

    private static isAgenticWalletInitialized(accountDataBase64: string): boolean {
        const stateCell = Cell.fromBase64(accountDataBase64);
        const slice = stateCell.beginParse();
        slice.loadUintBig(256); // nftItemIndex
        slice.loadAddress(); // collectionAddress
        slice.loadBit(); // isSignatureAllowed
        slice.loadUint(32); // seqno

        const hasExtensionsDict = slice.loadBit();
        if (hasExtensionsDict) {
            slice.loadRef();
        }

        return slice.loadMaybeRef() !== null;
    }

    private assertAgenticWalletVersion(): void {
        const version = (this.wallet as unknown as { version?: string }).version;
        if (version !== 'agentic') {
            throw new Error('deploy_agentic_subwallet is available only for WALLET_VERSION=agentic');
        }
    }

    private async getAgenticRootWalletState(): Promise<AgenticRootWalletState> {
        const accountState = await this.wallet.getClient().getAccountState(this.wallet.getAddress());
        if (!accountState.data) {
            throw new Error(`Account state data is empty for ${this.wallet.getAddress()}`);
        }

        let stateCell: Cell;
        try {
            stateCell = Cell.fromBase64(accountState.data);
        } catch (error) {
            throw new Error(
                `Failed to decode account state for ${this.wallet.getAddress()}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }

        const slice = stateCell.beginParse();
        const _nftItemIndex = slice.loadUintBig(256);
        const collectionAddress = slice.loadAddress();
        const _isSignatureAllowed = slice.loadBit();
        const _seqno = slice.loadUint(32);

        const hasExtensionsDict = slice.loadBit();
        if (hasExtensionsDict) {
            slice.loadRef();
        }

        const walletDataRef = slice.loadMaybeRef();
        if (!walletDataRef) {
            throw new Error('Current agentic wallet is not initialized. Deploy the root wallet first.');
        }

        const walletData = walletDataRef.beginParse();
        const ownerAddress = walletData.loadAddress();
        walletData.loadMaybeRef(); // nftItemContent
        const originOperatorPublicKey = walletData.loadUintBig(256);
        const _operatorPublicKey = walletData.loadUintBig(256);
        const deployedByUser = walletData.loadBit();

        return {
            ownerAddress,
            collectionAddress,
            originOperatorPublicKey,
            deployedByUser,
        };
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
            this.kit = new TonWalletKit({
                networks: {
                    [Network.mainnet().chainId]: {
                        apiClient: createApiClient('mainnet', this.config.networks?.mainnet?.apiKey),
                    },
                    [Network.testnet().chainId]: {
                        apiClient: createApiClient('testnet', this.config.networks?.testnet?.apiKey),
                    },
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
     * Get TON balance for any address.
     */
    async getBalanceByAddress(address: string): Promise<AddressBalanceResult> {
        const normalizedAddress = Address.parse(address).toString();
        const balanceNano = await this.wallet.getClient().getBalance(normalizedAddress);

        return {
            address: normalizedAddress,
            balanceNano,
            balanceTon: formatUnits(balanceNano, 9),
        };
    }

    /**
     * Get Jetton balance
     */
    async getJettonBalance(jettonAddress: string): Promise<string> {
        return this.wallet.getJettonBalance(jettonAddress);
    }

    /**
     * Get Jettons for any address.
     */
    async getJettonsByAddress(address: string, limit: number = 20, offset: number = 0): Promise<JettonInfoResult[]> {
        const normalizedAddress = Address.parse(address).toString();
        const response = await getJettonsFromClient(this.wallet.getClient(), normalizedAddress, {
            pagination: { limit, offset },
        });

        return response.jettons.map((jetton) => ({
            address: jetton.address,
            balance: jetton.balance,
            name: jetton.info.name,
            symbol: jetton.info.symbol,
            decimals: jetton.decimalsNumber,
        }));
    }

    /**
     * Get metadata for a Jetton master.
     */
    async getJettonInfo(jettonAddress: string): Promise<JettonMetadataResult | null> {
        const normalizedAddress = Address.parse(jettonAddress).toString();
        const client = this.wallet.getClient();
        const response = await client.jettonsByAddress({
            address: normalizedAddress,
            offset: 0,
            limit: 1,
        });

        if (!response.jetton_masters?.length || !response.jetton_masters[0]) {
            return null;
        }

        const jetton = response.jetton_masters[0];
        const jettonMasterAddress = (jetton as { address?: string; jetton?: string }).address ?? jetton.jetton;
        const metadata = jettonMasterAddress ? response.metadata?.[jettonMasterAddress] : undefined;
        const tokenInfo = metadata?.token_info?.find((item) => item.valid && item.type === 'jetton_masters') as
            | {
                  name?: string;
                  symbol?: string;
                  description?: string;
                  image?: string;
                  extra?: { decimals?: string | number; uri?: string };
              }
            | undefined;

        let decimals: number | undefined;
        if (tokenInfo?.extra?.decimals !== undefined) {
            const value = tokenInfo.extra.decimals;
            decimals = typeof value === 'string' ? Number.parseInt(value, 10) : value;
            if (!Number.isFinite(decimals)) {
                decimals = undefined;
            }
        }

        return {
            address: jettonMasterAddress ?? normalizedAddress,
            name: tokenInfo?.name ?? '',
            symbol: tokenInfo?.symbol ?? '',
            decimals,
            description: tokenInfo?.description ?? '',
            image: tokenInfo?.image,
            uri: tokenInfo?.extra?.uri,
        };
    }

    /**
     * Resolve jetton-wallet address for an owner.
     */
    async getJettonWalletAddress(jettonAddress: string, ownerAddress: string): Promise<string> {
        const normalizedJettonAddress = Address.parse(jettonAddress).toString();
        const normalizedOwnerAddress = Address.parse(ownerAddress).toString();

        return getJettonWalletAddressFromClient(
            this.wallet.getClient(),
            normalizedJettonAddress,
            normalizedOwnerAddress,
        );
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
        const safeLimit = Math.max(limit, 10);

        const response = await client.getEvents({
            account: address,
            limit: safeLimit,
            offset: 0,
        });

        const results: TransactionInfo[] = [];

        for (const event of response.events.slice(0, limit)) {
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

            const response = await this.wallet.sendTransaction(tx);

            return {
                success: true,
                message: `Successfully sent ${amountNano} nanoTON to ${toAddress}`,
                normalizedHash: response.normalizedHash,
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

            const response = await this.wallet.sendTransaction(tx);

            return {
                success: true,
                message: `Successfully sent jettons to ${toAddress}`,
                normalizedHash: response.normalizedHash,
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
            const tx = await this.wallet.sendTransaction(request as TransactionRequest);

            return {
                success: true,
                message: `Successfully sent transaction with ${request.messages.length} message(s)`,
                normalizedHash: tx.normalizedHash,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Deploy a new Agentic sub-wallet from the current Agentic root wallet.
     */
    async deployAgenticSubwallet(params: DeployAgenticSubwalletParams): Promise<DeployAgenticSubwalletResult> {
        try {
            this.assertAgenticWalletVersion();

            if (!/^\d+$/.test(params.amountNano) || BigInt(params.amountNano) <= 0n) {
                throw new Error('amountNano must be a positive integer in nanotons');
            }

            const operatorPublicKey = McpWalletService.parseUint256(params.operatorPublicKey, 'operatorPublicKey');
            if (operatorPublicKey === 0n) {
                throw new Error('operatorPublicKey must be non-zero');
            }

            const metadataName = params.metadata?.name;
            if (typeof metadataName !== 'string' || metadataName.trim().length === 0) {
                throw new Error('metadata.name is required and must be a non-empty string');
            }

            const rootState = await this.getAgenticRootWalletState();
            if (!rootState.deployedByUser) {
                throw new Error(
                    'Current wallet has deployedByUser=false and cannot deploy sub-wallets. Use the user-root wallet.',
                );
            }
            const nftItemContent = McpWalletService.buildOnchainMetadata(params.metadata);

            const subwalletNftIndex = McpWalletService.calculateAgenticWalletIndex(
                rootState.ownerAddress,
                operatorPublicKey,
                false,
            );
            const queryId = McpWalletService.createQueryId();

            const childWalletData = beginCell()
                .storeAddress(rootState.ownerAddress)
                .storeMaybeRef(nftItemContent)
                .storeUint(operatorPublicKey, 256)
                .storeUint(operatorPublicKey, 256)
                .storeBit(false)
                .endCell();

            const deployBody = McpWalletService.createDeployWalletBody(
                queryId,
                childWalletData,
                rootState.originOperatorPublicKey,
            );

            const childInit = {
                code: AgenticWalletCodeCell,
                data: McpWalletService.buildAgenticWalletConfigData(subwalletNftIndex, rootState.collectionAddress),
            };
            const childAddress = contractAddress(0, childInit);
            const childAddressFriendly = childAddress.toString();
            const childState = await this.wallet.getClient().getAccountState(childAddressFriendly);

            if (childState.data) {
                let isInitialized: boolean;
                try {
                    isInitialized = McpWalletService.isAgenticWalletInitialized(childState.data);
                } catch (error) {
                    throw new Error(
                        `Failed to preflight sub-wallet ${childAddressFriendly}: ${
                            error instanceof Error ? error.message : 'Unknown error'
                        }`,
                    );
                }

                if (isInitialized) {
                    throw new Error(
                        `Sub-wallet already initialized for operatorPublicKey=${operatorPublicKey.toString()} at ${childAddressFriendly}`,
                    );
                }
            }

            const stateInit = beginCell().store(storeStateInit(childInit)).endCell();

            const response = await this.wallet.sendTransaction({
                validUntil: Math.floor(Date.now() / 1000) + AGENTIC_DEFAULT_VALID_UNTIL,
                messages: [
                    {
                        address: childAddressFriendly,
                        amount: params.amountNano,
                        stateInit: stateInit.toBoc().toString('base64'),
                        payload: deployBody.toBoc().toString('base64'),
                    },
                ],
            } as TransactionRequest);

            return {
                success: true,
                message: `Successfully sent deploy transaction for sub-wallet ${childAddressFriendly}`,
                normalizedHash: response.normalizedHash,
                subwalletAddress: childAddressFriendly,
                subwalletNftIndex: subwalletNftIndex.toString(),
                ownerAddress: rootState.ownerAddress.toString(),
                collectionAddress: rootState.collectionAddress.toString(),
                operatorPublicKey: operatorPublicKey.toString(),
                amountNano: params.amountNano,
                queryId: queryId.toString(),
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Get the status of a transaction by its normalized hash.
     *
     * In TON, a single external message triggers a tree of internal messages.
     * The transaction is "complete" only when the entire trace finishes.
     */
    async getTransactionStatus(normalizedHash: string): Promise<TransactionStatusResponse> {
        const client = this.wallet.getClient();
        return getTransactionStatus(client, { normalizedHash });
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
            providerOptions: {
                settlementMethods: [SettlementMethod.SETTLEMENT_METHOD_SWAP, SettlementMethod.SETTLEMENT_METHOD_ESCROW],
            } as OmnistonProviderOptions,
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
     * Emulate a transaction without broadcasting it.
     * Returns the emulated preview with money flow analysis.
     */
    async emulateTransaction(params: {
        messages: Array<{
            address: string;
            amount: string;
            stateInit?: string;
            payload?: string;
        }>;
        validUntil?: number;
    }) {
        const preview = await this.wallet.getTransactionPreview({
            messages: params.messages as TransactionRequest['messages'],
            validUntil: params.validUntil,
        });
        return preview;
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
     * Get NFTs for any address.
     */
    async getNftsByAddress(address: string, limit: number = 20, offset: number = 0): Promise<NftInfoResult[]> {
        const normalizedAddress = Address.parse(address).toString();
        const response = await getNftsFromClient(this.wallet.getClient(), normalizedAddress, {
            pagination: { limit, offset },
        });

        return response.nfts.map((nft) => ({
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

            const response = await this.wallet.sendTransaction(tx);

            return {
                success: true,
                message: `Successfully sent NFT ${nftAddress} to ${toAddress}`,
                normalizedHash: response.normalizedHash,
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
     * Generate a signed TonProof for authenticating with third-party services.
     * Produces a payload compatible with TonConnect proof-of-ownership verification.
     */
    async generateTonProof(domain: string, payload: string): Promise<TonProofResult> {
        const address = Address.parse(this.wallet.getAddress());
        const stateInit = await this.wallet.getStateInit();
        const publicKey = this.wallet.getPublicKey();
        const timestamp = Math.floor(Date.now() / 1000);
        const domainLengthBytes = Buffer.byteLength(domain, 'utf-8');

        const proofMessage: ProofMessage = {
            workchain: address.workChain,
            addressHash: Uint8ArrayToHex(address.hash),
            domain: { lengthBytes: domainLengthBytes, value: domain },
            payload,
            stateInit,
            timestamp,
        };

        const signatureHex = await this.wallet.getSignedTonProof(proofMessage);
        const signatureBase64 = HexToBase64(signatureHex);

        return {
            address: `${address.workChain}:${address.hash.toString('hex')}`,
            chain: this.wallet.getNetwork().chainId === Network.mainnet().chainId ? '-239' : '-3',
            walletStateInit: stateInit,
            publicKey,
            timestamp,
            domainLengthBytes,
            domainValue: domain,
            signature: signatureBase64,
            payload,
        };
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
