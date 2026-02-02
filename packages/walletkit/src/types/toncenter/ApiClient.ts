/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Address } from '@ton/core';

import type { ToncenterResponseJettonMasters, ToncenterTracesResponse } from './emulation';
import type { FullAccountState } from './api';
import type { Event } from './AccountEvent';
import type {
    Base64String,
    UserNFTsRequest,
    NFTsRequest,
    NFTsResponse,
    TokenAmount,
    TransactionsResponse,
    UserFriendlyAddress,
    JettonsResponse,
    RawStackItem,
    GetMethodResult,
} from '../../api/models';
import type { ToncenterEmulationResult } from '../../utils/toncenterEmulation';

export interface LimitRequest {
    limit?: number;
    offset?: number;
}

export interface NftItemsRequest {
    address?: Array<Address | string>;
}

export interface NftItemsByOwnerRequest extends LimitRequest {
    ownerAddress?: Array<Address | string>;
    sortByLastTransactionLt?: boolean;
}

export interface TransactionsByAddressRequest extends LimitRequest {
    address?: Array<Address | string>;
}

export type GetTransactionByHashRequest =
    | {
          msgHash: string;
      }
    | {
          bodyHash: string;
      };

export type GetPendingTransactionsRequest =
    | {
          accounts: Array<Address | string>;
      }
    | {
          traceId: Array<string>;
      };

export type GetTraceRequest = {
    account?: Address | string;
    traceId?: Array<string>;
};

export type GetPendingTraceRequest = {
    externalMessageHash: Array<string>;
};

export interface GetJettonsByOwnerRequest {
    ownerAddress: Address | string;
    offset?: number;
    limit?: number;
}

export interface GetJettonsByAddressRequest {
    address: UserFriendlyAddress;
    offset?: number;
    limit?: number;
}

export interface GetEventsRequest {
    account: Address | string;
    offset?: number;
    limit?: number;
}

export interface GetEventsResponse {
    events: Event[];
    offset: number;
    limit: number;
    hasNext: boolean;
}

export interface ApiClient {
    nftItemsByAddress(request: NFTsRequest): Promise<NFTsResponse>;
    nftItemsByOwner(request: UserNFTsRequest): Promise<NFTsResponse>;
    fetchEmulation(messageBoc: Base64String, ignoreSignature?: boolean): Promise<ToncenterEmulationResult>;
    sendBoc(boc: Base64String): Promise<string>;
    runGetMethod(
        address: UserFriendlyAddress,
        method: string,
        stack?: RawStackItem[],
        seqno?: number,
    ): Promise<GetMethodResult>; // TODO - Make serializable
    getAccountState(address: UserFriendlyAddress, seqno?: number): Promise<FullAccountState>;
    getBalance(address: UserFriendlyAddress, seqno?: number): Promise<TokenAmount>;

    getAccountTransactions(request: TransactionsByAddressRequest): Promise<TransactionsResponse>;
    getTransactionsByHash(request: GetTransactionByHashRequest): Promise<TransactionsResponse>;

    getPendingTransactions(request: GetPendingTransactionsRequest): Promise<TransactionsResponse>;

    getTrace(request: GetTraceRequest): Promise<ToncenterTracesResponse>;
    getPendingTrace(request: GetPendingTraceRequest): Promise<ToncenterTracesResponse>;

    resolveDnsWallet(domain: string): Promise<string | null>;
    backResolveDnsWallet(address: UserFriendlyAddress): Promise<string | null>;

    jettonsByAddress(request: GetJettonsByAddressRequest): Promise<ToncenterResponseJettonMasters>;
    jettonsByOwnerAddress(request: GetJettonsByOwnerRequest): Promise<JettonsResponse>;

    getEvents(request: GetEventsRequest): Promise<GetEventsResponse>;
}
