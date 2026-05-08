/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    BridgeEvent,
    ConnectionRequestEvent,
    ConnectionRequestEventPreview,
    ConnectEvent,
    ConnectEventError,
    DAppInfo,
    DisconnectEvent,
    JettonsResponse,
    NFT,
    NFTsResponse,
    SendTransactionResponse,
    StreamingWatchType,
    TONConnectSession,
    TonApiStreamingProviderConfig,
    TonCenterStreamingProviderConfig,
    Transaction,
    TransactionEmulatedPreview,
    TransactionRequest,
    Wallet,
    WalletResponse,
} from '@ton/walletkit';
import type { DeDustSwapProviderConfig } from '@ton/walletkit/swap/dedust';
import type { OmnistonSwapProviderConfig } from '@ton/walletkit/swap/omniston';

/**
 * TonConnect event payload types that can be returned from processInternalBrowserRequest.
 */
export type TonConnectEventPayload = ConnectEvent | ConnectEventError | WalletResponse | DisconnectEvent;
import type { WalletKitBridgeEventCallback } from './events';
import type { WalletKitBridgeInitConfig } from './walletkit';

export type PromiseOrValue<T> = T | Promise<T>;

export interface SetEventsListenersArgs {
    callback?: WalletKitBridgeEventCallback;
}

export interface MnemonicToKeyPairArgs {
    mnemonic: string[];
    mnemonicType?: 'ton' | 'bip39';
}

export interface SignArgs {
    data: number[];
    secretKey: number[];
}

export interface CreateTonMnemonicArgs {
    count?: number;
}

export interface CreateSignerFromMnemonicArgs {
    mnemonic: string[];
    mnemonicType?: string;
}

export interface CreateSignerFromPrivateKeyArgs {
    secretKey: string;
}

export interface CreateSignerFromCustomArgs {
    signerId: string;
    publicKey: string;
}

export interface CreateWalletAdapterArgs {
    signerId: string;
    network: { chainId: string };
    workchain?: number;
    walletId?: number;
    /** Optional signature domain for L2 chains (e.g. Tetra). */
    domain?: { type: 'l2'; globalId: number } | { type: 'empty' };
}

export interface AddWalletArgs {
    adapterId: string;
}

export interface ReleaseRefArgs {
    id: string;
}

export interface RemoveWalletArgs {
    walletId: string;
}

export interface GetBalanceArgs {
    walletId: string;
}

export interface GetRecentTransactionsArgs {
    walletId: string;
    limit?: number;
}

export interface CreateTransferTonTransactionArgs {
    walletId: string;
    recipientAddress: string;
    transferAmount: string;
    comment?: string;
    body?: string;
    stateInit?: string;
}

export interface MultiTransferMessage {
    recipientAddress: string;
    transferAmount: string;
    comment?: string;
    body?: string;
    stateInit?: string;
}

export interface CreateTransferMultiTonTransactionArgs {
    walletId: string;
    messages: MultiTransferMessage[];
}

export interface TransactionContentArgs {
    walletId: string;
    transactionContent: TransactionRequest;
}

export interface TonConnectRequestEvent extends BridgeEvent {
    wallet?: Wallet;
    request?: BridgeEvent & { from?: string };
    preview?: ConnectionRequestEventPreview;
    dAppInfo?: DAppInfo;
    domain?: string;
    isJsBridge?: boolean;
    tabId?: string;
    messageId?: string;
}

export interface ApproveConnectRequestArgs {
    event: TonConnectRequestEvent;
    response?: {
        proof: {
            signature: string;
            timestamp: number;
            domain: {
                lengthBytes: number;
                value: string;
            };
            payload: string;
        };
    };
}

export interface RejectConnectRequestArgs {
    event: TonConnectRequestEvent;
    reason?: string;
    errorCode?: number;
}

export interface ApproveTransactionRequestArgs {
    event: TonConnectRequestEvent;
    response?: {
        signedBoc: string;
    };
}

export interface RejectTransactionRequestArgs {
    event: TonConnectRequestEvent;
    reason?: string | { code: number; message: string };
}

export interface ApproveSignDataRequestArgs {
    event: TonConnectRequestEvent;
    response?: {
        signature: string;
        timestamp: number;
        domain: string;
    };
}

export interface RejectSignDataRequestArgs {
    event: TonConnectRequestEvent;
    reason?: string;
}

export interface DisconnectSessionArgs {
    sessionId?: string;
}

export interface GetNftsArgs {
    walletId: string;
    pagination?: { limit?: number; offset?: number };
    collectionAddress?: string;
    indirectOwnership?: boolean;
}

export interface GetNftArgs {
    walletId: string;
    nftAddress: string;
}

export interface CreateTransferNftTransactionArgs {
    walletId: string;
    nftAddress: string;
    transferAmount?: string;
    recipientAddress: string;
    comment?: string;
}

export interface CreateTransferNftRawTransactionArgs {
    walletId: string;
    nftAddress: string;
    transferAmount: string;
    message: TransactionRequest;
}

export interface GetJettonsArgs {
    walletId: string;
    pagination?: { limit?: number; offset?: number };
}

export interface CreateTransferJettonTransactionArgs {
    walletId: string;
    jettonAddress: string;
    transferAmount: string;
    recipientAddress: string;
    comment?: string;
}

export interface GetJettonBalanceArgs {
    walletId: string;
    jettonAddress: string;
}

export interface GetJettonWalletAddressArgs {
    walletId: string;
    jettonAddress: string;
}

export interface ProcessInternalBrowserRequestArgs {
    messageId: string;
    method: string;
    params?: Record<string, unknown>;
    from?: string;
    url?: string;
    manifestUrl?: string;
}

export interface EmitBrowserPageArgs {
    url: string;
}

export interface EmitBrowserErrorArgs {
    message: string;
}

export interface EmitBrowserBridgeRequestArgs {
    messageId: string;
    method: string;
    request: string;
}

export interface CreateTonCenterStreamingProviderArgs {
    config: TonCenterStreamingProviderConfig;
}

export interface CreateTonApiStreamingProviderArgs {
    config: TonApiStreamingProviderConfig;
}

export interface RegisterStreamingProviderArgs {
    providerId: string;
}

export interface StreamingHasProviderArgs {
    network: { chainId: string };
}

export interface StreamingWatchArgs {
    network: { chainId: string };
    address: string;
    types: StreamingWatchType[];
}

export interface StreamingUnwatchArgs {
    subscriptionId: string;
}

export interface StreamingWatchConnectionChangeArgs {
    network: { chainId: string };
}

export interface StreamingWatchAddressArgs {
    network: { chainId: string };
    address: string;
}

export interface RegisterKotlinStreamingProviderArgs {
    providerId: string;
    network: { chainId: string };
}

export interface KotlinProviderDispatchArgs {
    subId: string;
    updateJson: string;
}

export interface RegisterKotlinStakingProviderArgs {
    providerId: string;
    supportedUnstakeModes: string[];
}

export interface HandleTonConnectUrlArgs {
    url: string;
}

export interface TonStakersChainConfig {
    contractAddress?: string;
    tonApiToken?: string;
}

export interface CreateTonStakersStakingProviderArgs {
    config?: {
        mainnet?: TonStakersChainConfig;
        testnet?: TonStakersChainConfig;
    };
}

export interface RegisterStakingProviderArgs {
    providerId: string;
}

export interface SetDefaultStakingProviderArgs {
    providerId: string;
}

export interface GetStakingQuoteArgs {
    direction: 'stake' | 'unstake';
    amount: string;
    userAddress?: string;
    network?: { chainId: string };
    unstakeMode?: string;
    providerOptions?: unknown;
    providerId?: string;
}

export interface BuildStakeTransactionArgs {
    quote: StakingQuoteResponse;
    userAddress: string;
    providerOptions?: unknown;
    providerId?: string;
}

export interface StakingQuoteResponse {
    direction: 'stake' | 'unstake';
    amountIn: string;
    amountOut: string;
    network: { chainId: string };
    providerId: string;
    apy?: number;
    unstakeMode?: string;
    estimatedUnstakeDelayHours?: number;
    instantUnstakeAvailable?: string;
    metadata?: unknown;
}

export interface GetStakedBalanceArgs {
    userAddress: string;
    network?: { chainId: string };
    providerId?: string;
}

export interface GetStakingProviderInfoArgs {
    network?: { chainId: string };
    providerId?: string;
}

export interface GetSupportedUnstakeModesArgs {
    providerId?: string;
}

export interface CreateOmnistonSwapProviderArgs {
    config?: OmnistonSwapProviderConfig;
}

export interface CreateDeDustSwapProviderArgs {
    config?: DeDustSwapProviderConfig;
}

export interface RegisterSwapProviderArgs {
    providerId: string;
}

export interface RegisterKotlinSwapProviderArgs {
    providerId: string;
}

export interface GetSwapQuoteArgs {
    params: Record<string, unknown>;
    providerId?: string;
}

export interface SetDefaultSwapProviderArgs {
    providerId: string;
}

export interface HasSwapProviderArgs {
    providerId: string;
}

export interface BuildSwapTransactionArgs {
    params: Record<string, unknown>;
}

export interface WalletKitBridgeApi {
    init(config?: WalletKitBridgeInitConfig): PromiseOrValue<{ ok: true }>;
    setEventsListeners(args?: SetEventsListenersArgs): PromiseOrValue<{ ok: true }>;
    removeEventListeners(): PromiseOrValue<{ ok: true }>;
    mnemonicToKeyPair(args: MnemonicToKeyPairArgs): PromiseOrValue<{ publicKey: Uint8Array; secretKey: Uint8Array }>;
    sign(args: SignArgs): PromiseOrValue<string>;
    createTonMnemonic(args?: CreateTonMnemonicArgs): PromiseOrValue<string[]>;
    createSignerFromMnemonic(
        args: CreateSignerFromMnemonicArgs,
    ): PromiseOrValue<{ signerId: string; publicKey: string }>;
    createSignerFromPrivateKey(
        args: CreateSignerFromPrivateKeyArgs,
    ): PromiseOrValue<{ signerId: string; publicKey: string }>;
    createSignerFromCustom(args: CreateSignerFromCustomArgs): PromiseOrValue<{ signerId: string; publicKey: string }>;
    createV5R1WalletAdapter(args: CreateWalletAdapterArgs): PromiseOrValue<{ adapterId: string; address: string }>;
    createV4R2WalletAdapter(args: CreateWalletAdapterArgs): PromiseOrValue<{ adapterId: string; address: string }>;
    addWallet(args: AddWalletArgs): PromiseOrValue<{ walletId: string | undefined; wallet: Wallet } | null>;
    releaseRef(args: ReleaseRefArgs): PromiseOrValue<{ ok: boolean }>;
    getWallets(): PromiseOrValue<{ walletId: string | undefined; wallet: Wallet }[]>;
    getWallet(args: { walletId: string }): PromiseOrValue<{ walletId: string | undefined; wallet: Wallet } | null>;
    getWalletAddress(args: { walletId: string }): PromiseOrValue<string | null>;
    removeWallet(args: RemoveWalletArgs): PromiseOrValue<void>;
    getBalance(args: GetBalanceArgs): PromiseOrValue<string | undefined>;
    getRecentTransactions(args: GetRecentTransactionsArgs): PromiseOrValue<Transaction[]>;
    handleTonConnectUrl(args: HandleTonConnectUrlArgs): PromiseOrValue<void>;
    connectionEventFromUrl(args: string): PromiseOrValue<ConnectionRequestEvent>;
    createTransferTonTransaction(args: CreateTransferTonTransactionArgs): PromiseOrValue<TransactionRequest>;
    createTransferMultiTonTransaction(args: CreateTransferMultiTonTransactionArgs): PromiseOrValue<TransactionRequest>;
    getTransactionPreview(args: TransactionContentArgs): PromiseOrValue<TransactionEmulatedPreview>;
    handleNewTransaction(args: TransactionContentArgs): PromiseOrValue<void>;
    sendTransaction(args: TransactionContentArgs): PromiseOrValue<SendTransactionResponse>;
    approveConnectRequest(args: ApproveConnectRequestArgs): PromiseOrValue<void>;
    rejectConnectRequest(args: RejectConnectRequestArgs): PromiseOrValue<{ success: boolean }>;
    approveTransactionRequest(args: ApproveTransactionRequestArgs): PromiseOrValue<{ signedBoc: string }>;
    rejectTransactionRequest(args: RejectTransactionRequestArgs): PromiseOrValue<{ success: boolean }>;
    approveSignDataRequest(args: ApproveSignDataRequestArgs): PromiseOrValue<{ signature: string; timestamp: number }>;
    rejectSignDataRequest(args: RejectSignDataRequestArgs): PromiseOrValue<{ success: boolean }>;
    listSessions(): PromiseOrValue<{ items: TONConnectSession[] }>;
    disconnectSession(args?: DisconnectSessionArgs): PromiseOrValue<{ ok: boolean }>;
    getNfts(args: GetNftsArgs): PromiseOrValue<NFTsResponse>;
    getNft(args: GetNftArgs): PromiseOrValue<NFT | null>;
    createTransferNftTransaction(args: CreateTransferNftTransactionArgs): PromiseOrValue<TransactionRequest>;
    createTransferNftRawTransaction(args: CreateTransferNftRawTransactionArgs): PromiseOrValue<TransactionRequest>;
    getJettons(args: GetJettonsArgs): PromiseOrValue<JettonsResponse>;
    createTransferJettonTransaction(args: CreateTransferJettonTransactionArgs): PromiseOrValue<TransactionRequest>;
    getJettonBalance(args: GetJettonBalanceArgs): PromiseOrValue<string>;
    getJettonWalletAddress(args: GetJettonWalletAddressArgs): PromiseOrValue<string>;
    processInternalBrowserRequest(args: ProcessInternalBrowserRequestArgs): PromiseOrValue<TonConnectEventPayload>;
    emitBrowserPageStarted(args: EmitBrowserPageArgs): PromiseOrValue<{ success: boolean }>;
    emitBrowserPageFinished(args: EmitBrowserPageArgs): PromiseOrValue<{ success: boolean }>;
    emitBrowserError(args: EmitBrowserErrorArgs): PromiseOrValue<{ success: boolean }>;
    emitBrowserBridgeRequest(args: EmitBrowserBridgeRequestArgs): PromiseOrValue<{ success: boolean }>;
    createTonCenterStreamingProvider(
        args: CreateTonCenterStreamingProviderArgs,
    ): PromiseOrValue<{ providerId: string }>;
    createTonApiStreamingProvider(args: CreateTonApiStreamingProviderArgs): PromiseOrValue<{ providerId: string }>;
    registerStreamingProvider(args: RegisterStreamingProviderArgs): PromiseOrValue<void>;
    streamingHasProvider(args: StreamingHasProviderArgs): PromiseOrValue<{ hasProvider: boolean }>;
    streamingWatch(args: StreamingWatchArgs): PromiseOrValue<{ subscriptionId: string }>;
    streamingUnwatch(args: StreamingUnwatchArgs): PromiseOrValue<void>;
    streamingConnect(): PromiseOrValue<void>;
    streamingDisconnect(): PromiseOrValue<void>;
    streamingWatchConnectionChange(
        args: StreamingWatchConnectionChangeArgs,
    ): PromiseOrValue<{ subscriptionId: string }>;
    streamingWatchBalance(args: StreamingWatchAddressArgs): PromiseOrValue<{ subscriptionId: string }>;
    streamingWatchTransactions(args: StreamingWatchAddressArgs): PromiseOrValue<{ subscriptionId: string }>;
    streamingWatchJettons(args: StreamingWatchAddressArgs): PromiseOrValue<{ subscriptionId: string }>;
    registerKotlinStreamingProvider(args: RegisterKotlinStreamingProviderArgs): PromiseOrValue<void>;
    kotlinProviderDispatch(args: KotlinProviderDispatchArgs): PromiseOrValue<void>;
    createTonStakersStakingProvider(args?: CreateTonStakersStakingProviderArgs): PromiseOrValue<{ providerId: string }>;
    registerStakingProvider(args: RegisterStakingProviderArgs): PromiseOrValue<void>;
    setDefaultStakingProvider(args: SetDefaultStakingProviderArgs): PromiseOrValue<void>;
    getStakingQuote(args: GetStakingQuoteArgs): PromiseOrValue<StakingQuoteResponse>;
    buildStakeTransaction(args: BuildStakeTransactionArgs): PromiseOrValue<unknown>;
    getStakedBalance(args: GetStakedBalanceArgs): PromiseOrValue<{
        stakedBalance: string;
        instantUnstakeAvailable: string;
        providerId: string;
    }>;
    getStakingProviderInfo(args: GetStakingProviderInfoArgs): PromiseOrValue<{
        apy: number;
        instantUnstakeAvailable?: string;
        providerId: string;
    }>;
    getSupportedUnstakeModes(args: GetSupportedUnstakeModesArgs): PromiseOrValue<string[]>;
    registerKotlinStakingProvider(args: RegisterKotlinStakingProviderArgs): PromiseOrValue<void>;
    createOmnistonSwapProvider(args: CreateOmnistonSwapProviderArgs): PromiseOrValue<{ providerId: string }>;
    createDeDustSwapProvider(args: CreateDeDustSwapProviderArgs): PromiseOrValue<{ providerId: string }>;
    registerSwapProvider(args: RegisterSwapProviderArgs): PromiseOrValue<void>;
    setDefaultSwapProvider(args: SetDefaultSwapProviderArgs): PromiseOrValue<void>;
    getRegisteredSwapProviders(): PromiseOrValue<{ providerIds: string[] }>;
    hasSwapProvider(args: HasSwapProviderArgs): PromiseOrValue<{ result: boolean }>;
    getSwapQuote(args: GetSwapQuoteArgs): PromiseOrValue<unknown>;
    buildSwapTransaction(args: BuildSwapTransactionArgs): PromiseOrValue<unknown>;
    registerKotlinSwapProvider(args: RegisterKotlinSwapProviderArgs): PromiseOrValue<void>;
}
