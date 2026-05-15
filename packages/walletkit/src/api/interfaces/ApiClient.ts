/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Address } from '@ton/core';

import type { ToncenterResponseJettonMasters, ToncenterTracesResponse } from '../../types/toncenter/emulation';
import type { Event } from '../../types/toncenter/AccountEvent';
import type {
    AccountState,
    AccountStates,
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
    MasterchainInfo,
    Network,
} from '../models';
import type { EmulationResult } from '../models';

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
    getNetwork(): Network;

    nftItemsByAddress(request: NFTsRequest): Promise<NFTsResponse>;
    nftItemsByOwner(request: UserNFTsRequest): Promise<NFTsResponse>;
    fetchEmulation(messageBoc: Base64String, ignoreSignature?: boolean): Promise<EmulationResult>;
    sendBoc(boc: Base64String): Promise<string>;
    runGetMethod(
        address: UserFriendlyAddress,
        method: string,
        stack?: RawStackItem[],
        seqno?: number,
    ): Promise<GetMethodResult>; // TODO - Make serializable
    getAccountState(address: UserFriendlyAddress, seqno?: number): Promise<AccountState>;

    /**
     * Fetches blockchain state for multiple accounts in a single batched request.
     *
     * Returns a Record keyed by canonical (bounceable) addresses, normalized via
     * `asAddressFriendly`. Every input address is guaranteed to have a key:
     * accounts that don't exist on chain are represented by an `AccountState`
     * with `status: 'non-existing'`.
     *
     * Throws synchronously on any invalid address format (no network call made).
     * Throws on any HTTP failure. Has no `seqno` parameter — bulk endpoints
     * of both toncenter and tonapi do not support historical state queries.
     */
    getAccountStates(addresses: UserFriendlyAddress[]): Promise<AccountStates>;

    getBalance(address: UserFriendlyAddress, seqno?: number): Promise<TokenAmount>;

    getAccountTransactions(request: TransactionsByAddressRequest): Promise<TransactionsResponse>;
    getTransactionsByHash(request: GetTransactionByHashRequest): Promise<TransactionsResponse>;

    getPendingTransactions(request: GetPendingTransactionsRequest): Promise<TransactionsResponse>;

    getTrace(request: GetTraceRequest): Promise<ToncenterTracesResponse>;
    getPendingTrace(request: GetPendingTraceRequest): Promise<ToncenterTracesResponse>;

    resolveDnsWallet(domain: string): Promise<string | undefined>;
    backResolveDnsWallet(address: UserFriendlyAddress): Promise<string | undefined>;

    jettonsByAddress(request: GetJettonsByAddressRequest): Promise<ToncenterResponseJettonMasters>;
    jettonsByOwnerAddress(request: GetJettonsByOwnerRequest): Promise<JettonsResponse>;

    getEvents(request: GetEventsRequest): Promise<GetEventsResponse>;

    getMasterchainInfo(): Promise<MasterchainInfo>;
}
