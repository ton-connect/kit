/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Address } from '@ton/core';

import type { ConnectTransactionParamMessage } from '../internal';
import type {
    ToncenterEmulationResponse,
    ToncenterResponseJettonMasters,
    ToncenterTracesResponse,
    ToncenterTransactionsResponse,
} from './emulation';
import type { FullAccountState, GetResult } from './api';
import type { NftItemsResponse } from './NftItemsResponse';
import { RawStackItem } from '../../utils/tvmStack';
import { ResponseUserJettons } from '../export/responses/jettons';
import { AddressFriendly } from '../primitive';
import { Event } from './AccountEvent';

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
    address: AddressFriendly;
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
    nftItemsByAddress(request: NftItemsRequest): Promise<NftItemsResponse>;
    nftItemsByOwner(request: NftItemsByOwnerRequest): Promise<NftItemsResponse>;
    fetchEmulation(
        address: Address | string,
        messages: ConnectTransactionParamMessage[],
        seqno?: number,
    ): Promise<ToncenterEmulationResponse>;
    sendBoc(boc: string | Uint8Array): Promise<string>;
    runGetMethod(address: Address | string, method: string, stack?: RawStackItem[], seqno?: number): Promise<GetResult>; // TODO - Make serializable
    getAccountState(address: Address | string, seqno?: number): Promise<FullAccountState>;
    getBalance(address: Address | string, seqno?: number): Promise<string>;

    getAccountTransactions(request: TransactionsByAddressRequest): Promise<ToncenterTransactionsResponse>;
    getTransactionsByHash(request: GetTransactionByHashRequest): Promise<ToncenterTransactionsResponse>;

    getPendingTransactions(request: GetPendingTransactionsRequest): Promise<ToncenterTransactionsResponse>;

    getTrace(request: GetTraceRequest): Promise<ToncenterTracesResponse>;
    getPendingTrace(request: GetPendingTraceRequest): Promise<ToncenterTracesResponse>;

    resolveDnsWallet(domain: string): Promise<string | null>;
    backResolveDnsWallet(address: Address | string): Promise<string | null>;

    jettonsByAddress(request: GetJettonsByAddressRequest): Promise<ToncenterResponseJettonMasters>;
    jettonsByOwnerAddress(request: GetJettonsByOwnerRequest): Promise<ResponseUserJettons>;

    getEvents(request: GetEventsRequest): Promise<GetEventsResponse>;
}
