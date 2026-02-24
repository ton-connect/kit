/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    ApiClient,
    GetEventsRequest,
    GetEventsResponse,
    GetJettonsByAddressRequest,
    GetJettonsByOwnerRequest,
    GetPendingTraceRequest,
    GetPendingTransactionsRequest,
    GetTraceRequest,
    GetTransactionByHashRequest,
    TransactionsByAddressRequest,
} from '../types/toncenter/ApiClient';
import type {
    Base64String,
    GetMethodResult,
    JettonsResponse,
    NFTsRequest,
    NFTsResponse,
    RawStackItem,
    TokenAmount,
    TransactionsResponse,
    UserFriendlyAddress,
    UserNFTsRequest,
} from '../api/models';
import type { ToncenterEmulationResult } from '../utils/toncenterEmulation';
import type { FullAccountState } from '../types/toncenter/api';
import type { ToncenterResponseJettonMasters, ToncenterTracesResponse } from '../types/toncenter/emulation';

export class ApiClientTonApi implements ApiClient {
    async nftItemsByAddress(request: NFTsRequest): Promise<NFTsResponse> {
        throw new Error('Method not implemented.');
    }
    async nftItemsByOwner(request: UserNFTsRequest): Promise<NFTsResponse> {
        throw new Error('Method not implemented.');
    }
    async fetchEmulation(messageBoc: Base64String, ignoreSignature?: boolean): Promise<ToncenterEmulationResult> {
        throw new Error('Method not implemented.');
    }
    async sendBoc(boc: Base64String): Promise<string> {
        throw new Error('Method not implemented.');
    }
    async runGetMethod(
        address: UserFriendlyAddress,
        method: string,
        stack?: RawStackItem[],
        seqno?: number,
    ): Promise<GetMethodResult> {
        throw new Error('Method not implemented.');
    }
    async getAccountState(address: UserFriendlyAddress, seqno?: number): Promise<FullAccountState> {
        throw new Error('Method not implemented.');
    }
    async getBalance(address: UserFriendlyAddress, seqno?: number): Promise<TokenAmount> {
        throw new Error('Method not implemented.');
    }
    async getAccountTransactions(request: TransactionsByAddressRequest): Promise<TransactionsResponse> {
        throw new Error('Method not implemented.');
    }
    async getTransactionsByHash(request: GetTransactionByHashRequest): Promise<TransactionsResponse> {
        throw new Error('Method not implemented.');
    }
    async getPendingTransactions(request: GetPendingTransactionsRequest): Promise<TransactionsResponse> {
        throw new Error('Method not implemented.');
    }
    async getTrace(request: GetTraceRequest): Promise<ToncenterTracesResponse> {
        throw new Error('Method not implemented.');
    }
    async getPendingTrace(request: GetPendingTraceRequest): Promise<ToncenterTracesResponse> {
        throw new Error('Method not implemented.');
    }
    async resolveDnsWallet(domain: string): Promise<string | null> {
        throw new Error('Method not implemented.');
    }
    async backResolveDnsWallet(address: UserFriendlyAddress): Promise<string | null> {
        throw new Error('Method not implemented.');
    }
    async jettonsByAddress(request: GetJettonsByAddressRequest): Promise<ToncenterResponseJettonMasters> {
        throw new Error('Method not implemented.');
    }
    async jettonsByOwnerAddress(request: GetJettonsByOwnerRequest): Promise<JettonsResponse> {
        throw new Error('Method not implemented.');
    }
    async getEvents(request: GetEventsRequest): Promise<GetEventsResponse> {
        throw new Error('Method not implemented.');
    }
}
