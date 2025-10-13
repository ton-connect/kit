import { Address, TupleItem } from '@ton/core';

import type { ConnectTransactionParamMessage } from '../internal';
import type {
    ToncenterEmulationResponse,
    ToncenterResponseJettonMasters,
    ToncenterResponseJettonWallets,
    ToncenterTracesResponse,
    ToncenterTransactionsResponse,
} from './emulation';
import type { FullAccountState, GetResult } from './api';
import type { NftItemsResponse } from './NftItemsResponse';

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
    traceId: Array<string>;
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
    address: Address | string;
    offset?: number;
    limit?: number;
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
    runGetMethod(address: Address | string, method: string, stack?: TupleItem[], seqno?: number): Promise<GetResult>;
    getAccountState(address: Address | string, seqno?: number): Promise<FullAccountState>;
    getBalance(address: Address | string, seqno?: number): Promise<bigint>;

    getAccountTransactions(request: TransactionsByAddressRequest): Promise<ToncenterTransactionsResponse>;
    getTransactionsByHash(request: GetTransactionByHashRequest): Promise<ToncenterTransactionsResponse>;

    getPendingTransactions(request: GetPendingTransactionsRequest): Promise<ToncenterTransactionsResponse>;

    getTrace(request: GetTraceRequest): Promise<ToncenterTracesResponse>;
    getPendingTrace(request: GetPendingTraceRequest): Promise<ToncenterTracesResponse>;

    resolveDnsWallet(domain: string): Promise<string | null>;
    backResolveDnsWallet(address: Address | string): Promise<string | null>;

    jettonsByAddress(request: GetJettonsByAddressRequest): Promise<ToncenterResponseJettonMasters>;
    jettonsByOwnerAddress(request: GetJettonsByOwnerRequest): Promise<ToncenterResponseJettonWallets>;
}
