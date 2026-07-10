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
    BaseProvider,
    ProviderInput,
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
import { onchainMetadataKey } from '../utils/tep64.js';
import { readAgenticLimitsHash } from '../utils/agentic.js';
import { normalizeAddressForComparison } from '../utils/address.js';
import { computeLimitsUsage, evaluateLimits, loadActiveLimits, maxConfiguredWindow } from '../limits/enforce.js';
import type { AssetUsage, CachedLimits, LimitsCache, LimitsEnv, SyncedLimits } from '../limits/enforce.js';
import { buildReverseJettonMap } from '../limits/pending.js';
import {
    TON_ASSET_KEY,
    computeLimitsHash,
    limitsDictToStored,
    parseLimitsDictFromMessageBody,
} from '../limits/limits-codec.js';
import { resolveJettonProbes, transactionsToSpend } from '../limits/spend-window.js';
import type { JettonSpendProbe, SpendEntry } from '../limits/types.js';
import type { StoredLimits } from '../registry/config.js';

/** History fetch bounds for limit enforcement. */
const LIMITS_HISTORY_PAGE = 1000;
const LIMITS_HISTORY_MAX_PAGES = 10;

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
 * Active spend-limit config and usage for the wallet, in base units (matching the on-chain
 * `limitsDict`). `enabled: false` means no limits in force; `reason` says why.
 */
export interface LimitsInfoResult {
    enabled: boolean;
    reason?: 'not-agentic' | 'no-limits' | 'unverifiable';
    message?: string;
    limitsHash?: string;
    checkedAt?: number;
    assets?: AssetUsage[];
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
    // For GRAM (ex. TON) transfers
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

/** JSON-serializable message: amount is a nanoton string, stateInit/payload are Base64. */
export interface PreparedTransactionMessage {
    address: string;
    amount: string;
    stateInit?: string;
    payload?: string;
}

/** A transaction built but not signed or broadcast. */
export interface PreparedTransaction {
    messages: PreparedTransactionMessage[];
    validUntil?: number;
    /** Wallet the transaction was built for. Pass it back to send_raw_transaction: jetton/NFT messages are bound to this sender. */
    fromAddress?: string;
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
    /** Prepared transaction ready to preview/broadcast via send_raw_transaction. */
    transaction: PreparedTransaction;
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

    providers?: Array<ProviderInput<BaseProvider>>;
    /** Per-wallet limits cache (config-backed). Absent = re-sync limits on every send. */
    limitsCache?: LimitsCache;
}

interface McpWalletServiceInternalConfig {
    wallet: Wallet;
    contacts?: IContactResolver;
    /** Network-specific configuration */
    networks?: {
        mainnet?: NetworkConfig;
        testnet?: NetworkConfig;
    };

    providers?: Array<ProviderInput<BaseProvider>>;
    limitsCache?: LimitsCache;
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
    private readonly limitsCache: LimitsCache | null;
    private kit: TonWalletKit | null = null;

    private constructor(config: McpWalletServiceInternalConfig) {
        this.config = config;
        this.wallet = config.wallet;
        this.limitsCache = config.limitsCache ?? null;
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

    private static buildOnchainMetadataValue(value: string | number | boolean): Cell {
        const stringValue = typeof value === 'string' ? value : value.toString();
        return beginCell().storeUint(TEP64_SNAKE_CONTENT_PREFIX, 8).storeStringTail(stringValue).endCell();
    }

    private static buildOnchainMetadata(metadata: Record<string, string | number | boolean>): Cell {
        const dict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
        for (const [key, value] of Object.entries(metadata)) {
            dict.set(onchainMetadataKey(key), McpWalletService.buildOnchainMetadataValue(value));
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

    /** The adapter's wallet version. `Wallet` does not type it, so it is read defensively. */
    private get walletVersion(): string | undefined {
        return (this.wallet as unknown as { version?: string }).version;
    }

    private assertAgenticWalletVersion(): void {
        if (this.walletVersion !== 'agentic') {
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

    private static toPreparedTransaction(tx: TransactionRequest): PreparedTransaction {
        return {
            messages: tx.messages.map((m) => ({
                address: m.address,
                amount: m.amount.toString(),
                ...(m.stateInit ? { stateInit: m.stateInit } : {}),
                ...(m.payload ? { payload: m.payload } : {}),
            })),
            validUntil: tx.validUntil,
            ...(tx.fromAddress ? { fromAddress: tx.fromAddress } : {}),
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
            : network.chainId === Network.tetra().chainId
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

            if (this.config.providers) {
                for (const providerInput of this.config.providers) {
                    this.kit.registerProvider(providerInput);
                }
            }
        }
        return this.kit;
    }

    /**
     * Get GRAM (ex. TON) balance
     */
    async getBalance(): Promise<string> {
        return this.wallet.getBalance();
    }

    /**
     * Get GRAM (ex. TON) balance for any address.
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

    /** Builds the transfer without signing or broadcasting it. */
    async buildTonTransferTransaction(
        toAddress: string,
        amountNano: string,
        comment?: string,
    ): Promise<PreparedTransaction> {
        return McpWalletService.toPreparedTransaction(
            await this.wallet.createTransferTonTransaction({
                recipientAddress: toAddress,
                transferAmount: amountNano,
                comment,
            }),
        );
    }

    /**
     * Build → enforce on-chain-anchored spend limits → broadcast. The raw-send path
     * routes through this single choke point. Limits apply only to agentic wallets;
     * other wallets, and wallets with no on-chain limits, pass straight through.
     */
    private async sendWithLimits(
        build: () => Promise<TransactionRequest> | TransactionRequest,
        successMessage: string,
    ): Promise<TransferResult> {
        let request: TransactionRequest;
        try {
            request = await build();
        } catch (error) {
            return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
        }

        if (this.isAgenticWallet()) {
            try {
                const decision = await evaluateLimits(this.createLimitsEnv(), request.messages);
                if (!decision.allowed) {
                    return { success: false, message: decision.message };
                }
            } catch (error) {
                // Fail closed: if limits cannot be verified, refuse to broadcast.
                return {
                    success: false,
                    message: `Could not verify spend limits: ${error instanceof Error ? error.message : 'Unknown error'}`,
                };
            }
        }

        try {
            const response = await this.wallet.sendTransaction(request);
            return { success: true, message: successMessage, normalizedHash: response.normalizedHash };
        } catch (error) {
            return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    private isAgenticWallet(): boolean {
        return this.walletVersion === 'agentic';
    }

    /**
     * Current spend-limit config and usage, without sending. Resolves limits via the same
     * {@link loadActiveLimits} path enforcement uses, then meters spend over the largest window.
     */
    async getLimitsInfo(): Promise<LimitsInfoResult> {
        if (!this.isAgenticWallet()) {
            return { enabled: false, reason: 'not-agentic' };
        }
        const env = this.createLimitsEnv();
        const loaded = await loadActiveLimits(env);
        if (loaded.status === 'none') {
            return { enabled: false, reason: 'no-limits' };
        }
        if (loaded.status === 'error') {
            return { enabled: false, reason: 'unverifiable', message: loaded.message };
        }

        // One `now` so the fetch cutoff and window math share a boundary.
        const now = env.now();
        const reverseJettonMap = buildReverseJettonMap(loaded.jettonWallets);
        const maxWindow = maxConfiguredWindow(loaded.limits);
        const spendEntries = maxWindow > 0 ? await env.fetchSpendEntries(maxWindow, now, reverseJettonMap) : [];
        const assets = computeLimitsUsage(loaded.limits, spendEntries, now);
        return { enabled: true, limitsHash: loaded.hash, checkedAt: now, assets };
    }

    private createLimitsEnv(): LimitsEnv {
        return {
            now: () => Math.floor(Date.now() / 1000),
            readOnchainLimitsHash: () => this.readOnchainLimitsHash(),
            readCache: () => this.limitsCache?.read() ?? {},
            writeCache: (next: CachedLimits) => this.limitsCache?.write(next) ?? Promise.resolve(),
            syncLimitsFromChain: () => this.syncLimitsFromChain(),
            fetchSpendEntries: (maxWindowSeconds: number, now: number, reverseJettonMap: Map<string, string>) =>
                this.fetchSpendEntries(maxWindowSeconds, now, reverseJettonMap),
        };
    }

    private async readOnchainLimitsHash(): Promise<string | undefined> {
        const address = this.wallet.getAddress();
        const accountState = await this.wallet.getClient().getAccountState(address);
        return readAgenticLimitsHash(accountState, address);
    }

    /**
     * Find the most recent limits-change tx, parse its limitsDict, hash it, and
     * compute the forward jetton-wallet map for the configured masters. The map is
     * derived once here (same lifecycle as `limits_hash`) so metering needs no RPC.
     */
    private async syncLimitsFromChain(): Promise<SyncedLimits | null> {
        const client = this.wallet.getClient();
        const address = this.wallet.getAddress();
        for (let page = 0; page < LIMITS_HISTORY_MAX_PAGES; page += 1) {
            const response = await client.getAccountTransactions({
                address: [address],
                limit: LIMITS_HISTORY_PAGE,
                offset: page * LIMITS_HISTORY_PAGE,
            });
            if (response.transactions.length === 0) {
                break;
            }
            for (const transaction of response.transactions) {
                const body = transaction.inMessage?.messageContent?.body;
                if (!body) {
                    continue;
                }
                let dict: ReturnType<typeof parseLimitsDictFromMessageBody> = null;
                try {
                    dict = parseLimitsDictFromMessageBody(Cell.fromBase64(body));
                } catch {
                    // Malformed base64 body; treat as not a limits-change tx.
                }
                if (dict && dict.size > 0) {
                    const limits = limitsDictToStored(dict);
                    const jettonWallets = await this.computeJettonWalletMap(limits);
                    return { limits, hash: computeLimitsHash(dict), jettonWallets };
                }
            }
            if (response.transactions.length < LIMITS_HISTORY_PAGE) {
                break;
            }
        }
        return null;
    }

    /**
     * Compute our jetton-wallet address for every configured jetton master (the TON
     * sentinel is skipped). The `(owner, master) -> wallet` mapping is a deterministic,
     * immutable function of the jetton-wallet code, so it is computed once per limits
     * sync and cached. Keyed by the master display-key exactly as it appears in
     * `limits.assets`, valued by the normalized wallet address.
     *
     * Fails closed, all-or-nothing: if any master's wallet cannot be resolved (RPC
     * error or unparseable result), the whole map is rejected — a missing master at
     * metering time would otherwise be treated as unlimited and bypass its cap.
     */
    private async computeJettonWalletMap(limits: StoredLimits): Promise<Record<string, string>> {
        const owner = this.wallet.getAddress();
        const client = this.wallet.getClient();
        const masters = Object.keys(limits.assets).filter((assetKey) => assetKey !== TON_ASSET_KEY);
        const resolved = await Promise.all(
            masters.map(async (master) => {
                const walletAddress = await getJettonWalletAddressFromClient(client, master, owner);
                const normalized = normalizeAddressForComparison(walletAddress);
                if (!normalized) {
                    throw new Error(`Could not resolve a jetton-wallet address for master ${master}.`);
                }
                return [master, normalized] as const;
            }),
        );
        return Object.fromEntries(resolved);
    }

    /**
     * Page raw account transactions (newest first) until older than the window, then
     * meter outgoing spend from the messages directly. Uses `getAccountTransactions`
     * rather than `getEvents`: the events API is unreliable, carries pre-decoded data
     * we don't need, and caps each request at 100 events. Fails closed (throws) if the
     * page budget is exhausted while history still extends into the window: a truncated
     * history would under-count spend and could pass a cap that should have been
     * exceeded.
     *
     * Jetton outflows are resolved to their masters through the in-memory reverse map
     * ({@link resolveJettonProbes}) rather than a per-wallet `get_wallet_data` call, so
     * a full history scan adds no extra RPC beyond the transaction paging itself.
     */
    private async fetchSpendEntries(
        maxWindowSeconds: number,
        now: number,
        reverseJettonMap: Map<string, string>,
    ): Promise<SpendEntry[]> {
        const client = this.wallet.getClient();
        const address = this.wallet.getAddress();
        const cutoff = now - maxWindowSeconds;
        const tonEntries: SpendEntry[] = [];
        const jettonProbes: JettonSpendProbe[] = [];
        for (let page = 0; page < LIMITS_HISTORY_MAX_PAGES; page += 1) {
            const response = await client.getAccountTransactions({
                address: [address],
                limit: LIMITS_HISTORY_PAGE,
                offset: page * LIMITS_HISTORY_PAGE,
            });
            if (response.transactions.length === 0) {
                return [...tonEntries, ...resolveJettonProbes(jettonProbes, reverseJettonMap)];
            }
            const within: typeof response.transactions = [];
            let reachedCutoff = false;
            for (const transaction of response.transactions) {
                if (transaction.now < cutoff) {
                    reachedCutoff = true;
                    break;
                }
                within.push(transaction);
            }
            const spend = transactionsToSpend(within, address);
            tonEntries.push(...spend.tonEntries);
            jettonProbes.push(...spend.jettonProbes);
            if (reachedCutoff || response.transactions.length < LIMITS_HISTORY_PAGE) {
                return [...tonEntries, ...resolveJettonProbes(jettonProbes, reverseJettonMap)];
            }
        }
        throw new Error(
            `Spend history exceeds ${LIMITS_HISTORY_MAX_PAGES * LIMITS_HISTORY_PAGE} transactions within the limit ` +
                `window; cannot verify limits without truncating history.`,
        );
    }

    /** Builds the transfer without signing or broadcasting it. */
    async buildJettonTransferTransaction(
        toAddress: string,
        jettonAddress: string,
        amountRaw: string,
        comment?: string,
    ): Promise<PreparedTransaction> {
        return McpWalletService.toPreparedTransaction(
            await this.wallet.createTransferJettonTransaction({
                recipientAddress: toAddress,
                jettonAddress,
                transferAmount: amountRaw,
                comment,
            }),
        );
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
        return this.sendWithLimits(
            () => request as TransactionRequest,
            `Successfully sent transaction with ${request.messages.length} message(s)`,
        );
    }

    /**
     * Deploy a new Agentic sub-wallet from the current Agentic root wallet.
     */
    async deployAgenticSubwallet(params: DeployAgenticSubwalletParams): Promise<DeployAgenticSubwalletResult> {
        try {
            this.assertAgenticWalletVersion();

            if (!/^\d+$/.test(params.amountNano) || BigInt(params.amountNano) <= 0n) {
                throw new Error('amountNano must be a positive integer in nano units');
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

            const request: TransactionRequest = {
                validUntil: Math.floor(Date.now() / 1000) + AGENTIC_DEFAULT_VALID_UNTIL,
                messages: [
                    {
                        address: childAddressFriendly,
                        amount: params.amountNano,
                        stateInit: stateInit.toBoc().toString('base64'),
                        payload: deployBody.toBoc().toString('base64'),
                    },
                ],
            } as TransactionRequest;

            const result = await this.sendWithLimits(
                () => request,
                `Successfully sent deploy transaction for sub-wallet ${childAddressFriendly}`,
            );
            if (!result.success) {
                return result;
            }

            return {
                ...result,
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
     * @param fromToken Token to swap from ("TON" for native GRAM (ex. TON), or jetton address)
     * @param toToken Token to swap to ("TON" for native GRAM (ex. TON), or jetton address)
     * @param amount Amount to swap in human-readable format (e.g., "1.5" for 1.5 GRAM (ex. TON))
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

        // Get decimals for tokens (GRAM (ex. TON) has 9 decimals, jettons need to be fetched)
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
            transaction: McpWalletService.toPreparedTransaction(tx),
        };
    }

    /**
     * Emulate a transaction without broadcasting it.
     * Returns the emulated preview with money flow analysis.
     */
    async emulateTransaction(params: PreparedTransaction) {
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

    /** Builds the transfer without signing or broadcasting it. */
    async buildNftTransferTransaction(
        nftAddress: string,
        toAddress: string,
        comment?: string,
    ): Promise<PreparedTransaction> {
        return McpWalletService.toPreparedTransaction(
            await this.wallet.createTransferNftTransaction({
                nftAddress,
                recipientAddress: toAddress,
                comment,
            }),
        );
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
        const address = await client.resolveDnsWallet(domain);
        return address ?? null;
    }

    /**
     * Reverse resolve a wallet address to a TON DNS domain
     */
    async backResolveDns(address: string): Promise<string | null> {
        const client = this.wallet.getClient();
        const domain = await client.backResolveDnsWallet(address);
        return domain ?? null;
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

        const addressHash = Uint8ArrayToHex(address.hash);
        const proofMessage: ProofMessage = {
            workchain: address.workChain,
            addressHash: addressHash,
            domain: { lengthBytes: domainLengthBytes, value: domain },
            payload,
            stateInit,
            timestamp,
        };

        const signatureHex = await this.wallet.getSignedTonProof(proofMessage);
        const signatureBase64 = HexToBase64(signatureHex);

        return {
            address: address.toRawString(),
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
