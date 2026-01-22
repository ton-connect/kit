/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    ApiClient,
    Base64String,
    UserFriendlyAddress,
    RawStackItem,
    GetMethodResult,
    NFTsRequest,
    NFTsResponse,
    UserNFTsRequest,
    TokenAmount,
    TransactionsResponse,
    JettonsResponse,
    FullAccountState,
    ToncenterEmulationResult,
    ToncenterResponseJettonMasters,
    ToncenterTracesResponse,
    TransactionsByAddressRequest,
    GetTransactionByHashRequest,
    GetPendingTransactionsRequest,
    GetTraceRequest,
    GetPendingTraceRequest,
    GetJettonsByOwnerRequest,
    GetJettonsByAddressRequest,
    GetEventsRequest,
    GetEventsResponse,
    Network,
} from '@ton/walletkit';

import { log, error } from '../utils/logger';

type AndroidAPIClientBridge = {
    apiGetNetworks: () => string;
    apiSendBoc: (networkJson: string, boc: string) => string;
    apiRunGetMethod: (networkJson: string, address: string, method: string, stackJson: string | null, seqno: number) => string;
};

type AndroidWindow = Window & {
    WalletKitNative?: AndroidAPIClientBridge;
};

/**
 * Android native API client adapter.
 * Uses Android's JavascriptInterface methods for API calls.
 * Similar to SwiftAPIClientAdapter for iOS.
 */
export class AndroidAPIClientAdapter implements ApiClient {
    private androidBridge: AndroidAPIClientBridge;
    private network: Network;

    constructor(network: Network) {
        const androidWindow = window as AndroidWindow;
        if (!androidWindow.WalletKitNative) {
            throw new Error('WalletKitNative bridge not available');
        }
        this.androidBridge = androidWindow.WalletKitNative;
        this.network = network;
    }

    /**
     * Check if native API clients are available.
     */
    static isAvailable(): boolean {
        const androidWindow = window as AndroidWindow;
        return typeof androidWindow.WalletKitNative?.apiGetNetworks === 'function';
    }

    /**
     * Get all networks that have native API clients configured.
     */
    static getAvailableNetworks(): Network[] {
        const androidWindow = window as AndroidWindow;
        if (!androidWindow.WalletKitNative?.apiGetNetworks) {
            return [];
        }
        try {
            const networksJson = androidWindow.WalletKitNative.apiGetNetworks();
            return JSON.parse(networksJson) as Network[];
        } catch (err) {
            error('[AndroidAPIClientAdapter] Failed to get available networks:', err);
            return [];
        }
    }

    async sendBoc(boc: Base64String): Promise<string> {
        log('[AndroidAPIClientAdapter] sendBoc:', boc.substring(0, 50) + '...');
        try {
            const networkJson = JSON.stringify(this.network);
            const result = this.androidBridge.apiSendBoc(networkJson, boc);
            log('[AndroidAPIClientAdapter] sendBoc result:', result);
            return result;
        } catch (err) {
            error('[AndroidAPIClientAdapter] sendBoc failed:', err);
            throw err;
        }
    }

    async runGetMethod(
        address: UserFriendlyAddress,
        method: string,
        stack?: RawStackItem[],
        seqno?: number,
    ): Promise<GetMethodResult> {
        log('[AndroidAPIClientAdapter] runGetMethod:', address, method);
        try {
            const networkJson = JSON.stringify(this.network);
            const stackJson = stack ? JSON.stringify(stack) : null;
            const seqnoArg = seqno ?? -1; // Use -1 to represent null
            const resultJson = this.androidBridge.apiRunGetMethod(networkJson, address, method, stackJson, seqnoArg);
            const result = JSON.parse(resultJson) as GetMethodResult;
            log('[AndroidAPIClientAdapter] runGetMethod result:', result);
            return result;
        } catch (err) {
            error('[AndroidAPIClientAdapter] runGetMethod failed:', err);
            throw err;
        }
    }

    // Methods not implemented - will throw if called
    // These are optional for mobile usage

    async nftItemsByAddress(_request: NFTsRequest): Promise<NFTsResponse> {
        throw new Error('nftItemsByAddress is not implemented yet');
    }

    async nftItemsByOwner(_request: UserNFTsRequest): Promise<NFTsResponse> {
        throw new Error('nftItemsByOwner is not implemented yet');
    }

    async fetchEmulation(_messageBoc: Base64String, _ignoreSignature?: boolean): Promise<ToncenterEmulationResult> {
        throw new Error('fetchEmulation is not implemented yet');
    }

    async getAccountState(_address: UserFriendlyAddress, _seqno?: number): Promise<FullAccountState> {
        throw new Error('getAccountState is not implemented yet');
    }

    async getBalance(_address: UserFriendlyAddress, _seqno?: number): Promise<TokenAmount> {
        throw new Error('getBalance is not implemented yet');
    }

    async getAccountTransactions(_request: TransactionsByAddressRequest): Promise<TransactionsResponse> {
        throw new Error('getAccountTransactions is not implemented yet');
    }

    async getTransactionsByHash(_request: GetTransactionByHashRequest): Promise<TransactionsResponse> {
        throw new Error('getTransactionsByHash is not implemented yet');
    }

    async getPendingTransactions(_request: GetPendingTransactionsRequest): Promise<TransactionsResponse> {
        throw new Error('getPendingTransactions is not implemented yet');
    }

    async getTrace(_request: GetTraceRequest): Promise<ToncenterTracesResponse> {
        throw new Error('getTrace is not implemented yet');
    }

    async getPendingTrace(_request: GetPendingTraceRequest): Promise<ToncenterTracesResponse> {
        throw new Error('getPendingTrace is not implemented yet');
    }

    async resolveDnsWallet(_domain: string): Promise<string | null> {
        throw new Error('resolveDnsWallet is not implemented yet');
    }

    async backResolveDnsWallet(_address: UserFriendlyAddress): Promise<string | null> {
        throw new Error('backResolveDnsWallet is not implemented yet');
    }

    async jettonsByAddress(_request: GetJettonsByAddressRequest): Promise<ToncenterResponseJettonMasters> {
        throw new Error('jettonsByAddress is not implemented yet');
    }

    async jettonsByOwnerAddress(_request: GetJettonsByOwnerRequest): Promise<JettonsResponse> {
        throw new Error('jettonsByOwnerAddress is not implemented yet');
    }

    async getEvents(_request: GetEventsRequest): Promise<GetEventsResponse> {
        throw new Error('getEvents is not implemented yet');
    }
}
