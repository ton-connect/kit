/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    BridgeEvent,
    ConnectionRequestEventPreview,
    ConnectEvent,
    ConnectEventError,
    DAppInfo,
    DisconnectEvent,
    JettonsResponse,
    NFT,
    NFTsResponse,
    SendTransactionResponse,
    TONConnectSession,
    Transaction,
    TransactionEmulatedPreview,
    TransactionRequest,
    Wallet,
    WalletAdapter,
    WalletResponse,
    WalletSigner,
} from '@ton/walletkit';

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

export interface CreateSignerArgs {
    mnemonic?: string[];
    secretKey?: string;
    mnemonicType?: 'ton' | 'bip39';
}

export interface CreateAdapterArgs {
    signerId: string;
    walletVersion: 'v4r2' | 'v5r1';
    network: { chainId: string }; // Required - Kotlin must specify the network
    workchain?: number;
    walletId?: number;
    publicKey?: string;
    isCustom?: boolean;
}

export interface AddWalletArgs {
    adapterId: string;
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
    transactionContent: TransactionRequest | string; // Can be object (from Kotlin) or string (legacy)
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

export interface HandleTonConnectUrlArgs {
    url: string;
}

export interface HandleIntentUrlArgs {
    url: string;
}

export interface IsIntentUrlArgs {
    url: string;
}

export interface IntentItemsToTransactionRequestArgs {
    /** The intent event with items */
    event: {
        id: string;
        type: 'txIntent' | 'signMsg';
        network?: string;
        validUntil?: number;
        items: Array<{
            t: 'ton' | 'jetton' | 'nft';
            // TON fields
            a?: string;
            am?: string;
            p?: string;
            si?: string;
            ec?: Record<string, string>;
            // Jetton fields
            ma?: string;
            qi?: number;
            ja?: string;
            d?: string;
            rd?: string;
            cp?: string;
            fta?: string;
            fp?: string;
            // NFT fields
            na?: string;
            no?: string;
        }>;
    };
    /** The wallet ID to use for jetton/NFT address resolution */
    walletId: string;
}

/** Arguments for approving a transaction intent (txIntent or signMsg) */
export interface ApproveTransactionIntentArgs {
    /** The full transaction intent event */
    event: {
        id: string;
        clientId: string;
        hasConnectRequest: boolean;
        type: 'txIntent' | 'signMsg';
        network?: string;
        validUntil?: number;
        items: Array<{
            t: 'ton' | 'jetton' | 'nft';
            a?: string;
            am?: string;
            p?: string;
            si?: string;
            ec?: Record<string, string>;
            ma?: string;
            qi?: number;
            ja?: string;
            d?: string;
            rd?: string;
            cp?: string;
            fta?: string;
            fp?: string;
            na?: string;
            no?: string;
        }>;
    };
    /** The wallet ID to use for signing */
    walletId: string;
}

/** Arguments for approving a sign data intent (signIntent) */
export interface ApproveSignDataIntentArgs {
    /** The full sign data intent event */
    event: {
        id: string;
        clientId: string;
        hasConnectRequest: boolean;
        type: 'signIntent';
        network?: string;
        manifestUrl: string;
        payload: {
            type: 'text' | 'binary' | 'cell';
            text?: string;
            bytes?: string;
            schema?: string;
            cell?: string;
        };
    };
    /** The wallet ID to use for signing */
    walletId: string;
}

/** Arguments for rejecting any intent */
export interface RejectIntentArgs {
    /** The intent event to reject */
    event: {
        id: string;
        clientId: string;
        type: 'txIntent' | 'signMsg' | 'signIntent' | 'actionIntent';
    };
    /** Optional rejection reason */
    reason?: string;
    /** Optional error code */
    errorCode?: number;
}

/** Arguments for approving an action intent (actionIntent) */
export interface ApproveActionIntentArgs {
    /** The action intent event */
    event: {
        id: string;
        clientId: string;
        hasConnectRequest: boolean;
        type: 'actionIntent';
        network?: string;
        actionUrl: string;
        manifestUrl?: string;
    };
    /** The wallet ID to use for signing */
    walletId: string;
}

/** Arguments for processing connect request after intent approval */
export interface ProcessConnectAfterIntentArgs {
    /** The intent event with connect request */
    event: {
        id: string;
        clientId: string;
        hasConnectRequest: boolean;
        type: 'txIntent' | 'signMsg' | 'signIntent' | 'actionIntent';
        connectRequest?: {
            manifestUrl: string;
            items?: Array<{
                name: string;
                payload?: string;
            }>;
        };
    };
    /** The wallet ID to use for the connection */
    walletId: string;
    /** Optional proof (signature, timestamp, domain, payload) */
    proof?: {
        signature: string;
        timestamp: number;
        domain: {
            lengthBytes: number;
            value: string;
        };
        payload: string;
    };
}

export interface WalletDescriptor {
    address: string;
    publicKey: string;
    version: string;
    index: number;
    network: string;
}

export interface WalletKitBridgeApi {
    init(config?: WalletKitBridgeInitConfig): PromiseOrValue<{ ok: true }>;
    setEventsListeners(args?: SetEventsListenersArgs): PromiseOrValue<{ ok: true }>;
    removeEventListeners(): PromiseOrValue<{ ok: true }>;
    // Returns raw keyPair with Uint8Array - Kotlin handles conversion
    mnemonicToKeyPair(args: MnemonicToKeyPairArgs): PromiseOrValue<{ publicKey: Uint8Array; secretKey: Uint8Array }>;
    // Returns signature string directly
    sign(args: SignArgs): PromiseOrValue<string>;
    // Returns mnemonic words array directly
    createTonMnemonic(args?: CreateTonMnemonicArgs): PromiseOrValue<string[]>;
    // Returns temp ID and signer - Kotlin extracts signerId and publicKey
    createSigner(args: CreateSignerArgs): PromiseOrValue<{ _tempId: string; signer: WalletSigner }>;
    // Returns temp ID and adapter - Kotlin extracts adapterId and address
    createAdapter(args: CreateAdapterArgs): PromiseOrValue<{ _tempId: string; adapter: WalletAdapter }>;
    // Returns address string directly
    getAdapterAddress(args: { adapterId: string }): PromiseOrValue<string>;
    // Returns walletId with wallet object, or null
    addWallet(args: AddWalletArgs): PromiseOrValue<{ walletId: string | undefined; wallet: Wallet } | null>;
    // Returns array of walletId with wallet objects
    getWallets(): PromiseOrValue<{ walletId: string | undefined; wallet: Wallet }[]>;
    // Takes walletId, returns walletId with wallet object or null
    getWallet(args: { walletId: string }): PromiseOrValue<{ walletId: string | undefined; wallet: Wallet } | null>;
    // Returns address string or null directly
    getWalletAddress(args: { walletId: string }): PromiseOrValue<string | null>;
    // Returns void
    removeWallet(args: RemoveWalletArgs): PromiseOrValue<void>;
    // Returns balance as string or undefined
    getBalance(args: GetBalanceArgs): PromiseOrValue<string | undefined>;
    // Returns transactions array directly
    getRecentTransactions(args: GetRecentTransactionsArgs): PromiseOrValue<Transaction[]>;
    handleTonConnectUrl(args: HandleTonConnectUrlArgs): PromiseOrValue<void>;
    // Intent URL handling
    handleIntentUrl(args: HandleIntentUrlArgs): PromiseOrValue<void>;
    isIntentUrl(args: IsIntentUrlArgs): PromiseOrValue<boolean>;
    intentItemsToTransactionRequest(args: IntentItemsToTransactionRequestArgs): PromiseOrValue<TransactionRequest>;
    approveTransactionIntent(args: ApproveTransactionIntentArgs): PromiseOrValue<{ result: string; id: string }>;
    approveSignDataIntent(args: ApproveSignDataIntentArgs): PromiseOrValue<{
        result: { signature: string; address: string; timestamp: number; domain: string; payload: { type: string; text?: string; bytes?: string; schema?: string; cell?: string } };
        id: string;
    }>;
    rejectIntent(args: RejectIntentArgs): PromiseOrValue<{ error: { code: number; message: string }; id: string }>;
    approveActionIntent(args: ApproveActionIntentArgs): PromiseOrValue<{ result: unknown; id: string }>;
    processConnectAfterIntent(args: ProcessConnectAfterIntentArgs): PromiseOrValue<void>;
    createTransferTonTransaction(args: CreateTransferTonTransactionArgs): PromiseOrValue<TransactionRequest>;
    createTransferMultiTonTransaction(args: CreateTransferMultiTonTransactionArgs): PromiseOrValue<TransactionRequest>;
    getTransactionPreview(args: TransactionContentArgs): PromiseOrValue<TransactionEmulatedPreview>;
    handleNewTransaction(args: TransactionContentArgs): PromiseOrValue<{ success: boolean }>;
    // Returns result from wallet.sendTransaction
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
}
