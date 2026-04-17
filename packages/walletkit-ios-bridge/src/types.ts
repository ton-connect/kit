/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    ApiClient,
    Hex,
    Network,
    TonWalletKitOptions,
    WalletSigner,
    WalletAdapter,
    Wallet,
    TransactionRequest,
    BridgeEventMessageInfo,
    InjectedToExtensionBridgeRequestPayload,
    JettonsAPI,
    TONConnectSession,
    SignDataApprovalResponse,
    SendTransactionApprovalResponse,
    ConnectionApprovalResponse,
    SendTransactionRequestEvent,
    SignDataRequestEvent,
    SwapProviderInterface,
    SwapAPI,
    TonCenterStreamingProviderConfig,
    TonApiStreamingProviderConfig,
    StreamingProvider,
    StreamingAPI,
    StakingProviderInterface,
    StakingAPI,
} from '@ton/walletkit';
import type { OmnistonSwapProviderConfig } from '@ton/walletkit/swap/omniston';
import type { DeDustSwapProviderConfig } from '@ton/walletkit/swap/dedust';
import type { TonStakersProviderConfig } from '@ton/walletkit/staking/tonstakers';

import type { ConnectionRequestEvent } from '../../walletkit/dist/cjs';

export interface SwiftApiClient extends ApiClient {
    getNetwork: () => Network;
}

export interface SwiftWalletSigner {
    sign: (data: Iterable<number>) => Promise<Hex>;
    publicKey: () => Hex;
}

type ReusedTonWalletKitOptions = Pick<TonWalletKitOptions, 'deviceInfo' | 'walletManifest' | 'bridge' | 'dev'>;

export interface SwiftWalletKitConfiguration extends ReusedTonWalletKitOptions {
    networkConfigurations?: {
        network: Network;
        apiClientConfiguration?: {
            url?: string;
            key: string;
            timeout?: number;
            disableNetworkSend?: boolean;
            dnsResolver?: string;
        };
        apiClientType: 'default' | 'toncenter' | 'tonapi' | 'custom';
    }[];
    eventsConfiguration?: TonWalletKitOptions['eventProcessor'];
}

export type SwiftBridgeTransport = (data: { sessionID: string; messageID: string; message: unknown }) => void;

export interface SwiftWalletKit {
    isReady(): boolean;

    jettonsManager(): JettonsAPI;

    setEventsListeners(callback: (type: string, event: unknown) => Promise<void>): void;

    removeEventListeners(): void;

    createSignerFromMnemonic(mnemonic: string): Promise<WalletSigner>;

    createSignerFromPrivateKey(privateKey: string): Promise<WalletSigner>;

    createV4R2WalletAdapter(
        signer: WalletSigner | SwiftWalletSigner,
        parameters: { network: Network },
    ): Promise<WalletAdapter>;

    createV5R1WalletAdapter(
        signer: WalletSigner | SwiftWalletSigner,
        parameters: { network: Network },
    ): Promise<WalletAdapter>;

    jsSigner(signer: WalletSigner | SwiftWalletSigner): WalletSigner;

    processInjectedBridgeRequest(
        messageInfo: BridgeEventMessageInfo,
        request: InjectedToExtensionBridgeRequestPayload,
    ): Promise<unknown>;

    addWallet(walletAdapter: WalletAdapter): Promise<Wallet | undefined>;

    jsWalletAdapter(walletAdapter: WalletAdapter): WalletAdapter;

    getWallet(address: string): Wallet | undefined;

    removeWallet(address: string): Promise<void>;

    clearWallets(): Promise<void>;

    getWallets(): Wallet[];

    getSessions(): Promise<TONConnectSession[]>;

    handleTonConnectUrl(url: string): Promise<void>;

    approveConnectRequest(event: ConnectionRequestEvent, response?: ConnectionApprovalResponse): Promise<void>;

    rejectConnectRequest(event: ConnectionRequestEvent, reason?: string): Promise<void>;

    approveTransactionRequest(
        event: SendTransactionRequestEvent,
        response?: SendTransactionApprovalResponse,
    ): Promise<SendTransactionApprovalResponse>;
    rejectTransactionRequest(event: SendTransactionRequestEvent, reason?: string): Promise<void>;

    approveSignDataRequest(
        event: SignDataRequestEvent,
        response?: SignDataApprovalResponse,
    ): Promise<SignDataApprovalResponse>;

    rejectSignDataRequest(event: SignDataRequestEvent, reason?: string): Promise<void>;

    disconnect(sessionId: string): Promise<void>;

    sendTransaction(wallet: Wallet, transaction: TransactionRequest): Promise<void>;

    createOmnistonSwapProvider(config?: OmnistonSwapProviderConfig): SwapProviderInterface;

    createDeDustSwapProvider(config?: DeDustSwapProviderConfig): SwapProviderInterface;

    createTonCenterStreamingProvider(config: TonCenterStreamingProviderConfig): StreamingProvider;

    createTonApiStreamingProvider(config: TonApiStreamingProviderConfig): StreamingProvider;

    createTonStakersStakingProvider(config?: TonStakersProviderConfig): StakingProviderInterface;

    swap(): SwapAPI;

    streaming(): StreamingAPI;

    staking(): StakingAPI;
}
