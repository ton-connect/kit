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
    MasterchainInfo,
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
    /** Look up specific NFT items by address. */
    nftItemsByAddress(request: NFTsRequest): Promise<NFTsResponse>;
    /** List NFT items held by an owner; supports pagination. */
    nftItemsByOwner(request: UserNFTsRequest): Promise<NFTsResponse>;
    /** Run an emulation pass on a Base64-encoded BoC; returns the predicted account-state changes and emitted events without sending the message. */
    fetchEmulation(messageBoc: Base64String, ignoreSignature?: boolean): Promise<ToncenterEmulationResult>;
    /** Broadcast a signed BoC to the network and return the message hash. */
    sendBoc(boc: Base64String): Promise<string>;
    /** Run an on-chain `get` method against a contract and read its TVM stack output. */
    runGetMethod(
        address: UserFriendlyAddress,
        method: string,
        stack?: RawStackItem[],
        seqno?: number,
    ): Promise<GetMethodResult>; // TODO - Make serializable
    /** Read the full on-chain account state (code, data, status, balance) for an address. */
    getAccountState(address: UserFriendlyAddress, seqno?: number): Promise<FullAccountState>;
    /** Read the TON balance of an address in raw nanotons. */
    getBalance(address: UserFriendlyAddress, seqno?: number): Promise<TokenAmount>;

    /** List transactions for an address; ordered newest-first, paginated via `LimitRequest`. */
    getAccountTransactions(request: TransactionsByAddressRequest): Promise<TransactionsResponse>;
    /** Fetch a transaction by its message or body hash. */
    getTransactionsByHash(request: GetTransactionByHashRequest): Promise<TransactionsResponse>;

    /** List pending (unconfirmed) transactions by accounts or trace ids; useful for "in-flight" UIs. */
    getPendingTransactions(request: GetPendingTransactionsRequest): Promise<TransactionsResponse>;

    /** Fetch a confirmed trace (the tree of internal messages spawned by an external one). */
    getTrace(request: GetTraceRequest): Promise<ToncenterTracesResponse>;
    /** Fetch a pending trace by external-message hash, while it's still in flight. */
    getPendingTrace(request: GetPendingTraceRequest): Promise<ToncenterTracesResponse>;

    /** Resolve a TON DNS domain to the wallet address it points at; `null` when unset. */
    resolveDnsWallet(domain: string): Promise<string | null>;
    /** Reverse-resolve a wallet address to a TON DNS domain that points at it; `null` when none. */
    backResolveDnsWallet(address: UserFriendlyAddress): Promise<string | null>;

    /** Look up jetton masters by address — returns indexer metadata for the requested jettons. */
    jettonsByAddress(request: GetJettonsByAddressRequest): Promise<ToncenterResponseJettonMasters>;
    /** List jetton holdings owned by an address — returns balances + jetton-master metadata. */
    jettonsByOwnerAddress(request: GetJettonsByOwnerRequest): Promise<JettonsResponse>;

    /** List parsed account events (jetton transfers, NFT moves, swaps, …) for an address. */
    getEvents(request: GetEventsRequest): Promise<GetEventsResponse>;

    /** Read the latest masterchain info — last seqno, shards, time. */
    getMasterchainInfo(): Promise<MasterchainInfo>;
}
