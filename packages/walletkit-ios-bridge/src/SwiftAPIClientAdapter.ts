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
} from '@ton/walletkit';

export class SwiftAPIClientAdapter implements ApiClient {
    private swiftApiClient: ApiClient;

    constructor(swiftApiClient: ApiClient) {
        this.swiftApiClient = swiftApiClient;
    }

    async sendBoc(boc: Base64String): Promise<string> {
        return this.swiftApiClient.sendBoc(boc);
    }

    async runGetMethod(
        address: UserFriendlyAddress,
        method: string,
        stack?: RawStackItem[],
        seqno?: number,
    ): Promise<GetMethodResult> {
        return this.swiftApiClient.runGetMethod(address, method, stack, seqno);
    }

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
