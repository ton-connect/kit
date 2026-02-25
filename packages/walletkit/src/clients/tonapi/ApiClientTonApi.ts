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
} from '../../types/toncenter/ApiClient';
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
} from '../../api/models';
import type { ToncenterEmulationResult } from '../../utils/toncenterEmulation';
import type { FullAccountState } from '../../types/toncenter/api';
import type { ToncenterResponseJettonMasters, ToncenterTracesResponse } from '../../types/toncenter/emulation';
import { BaseApiClient } from '../BaseApiClient';
import type { BaseApiClientConfig } from '../BaseApiClient';
export { TonClientError } from '../TonClientError';
import type { TonApiAccount } from './types/accounts';
import { mapAccountState } from './mappers/map-account-state';
import { mapJettonMasters } from './mappers/map-jetton-masters';
import { mapUserJettons } from './mappers/map-user-jettons';
import { mapNftItemsResponse } from './mappers/map-nft-items';
import type { TonApiJettonInfo, TonApiJettonsBalances } from './types/jettons';
import type { TonApiNftItems, TonApiNftItem } from './types/nfts';
export class ApiClientTonApi extends BaseApiClient implements ApiClient {
    constructor(config: BaseApiClientConfig = {}) {
        const defaultEndpoint = config.network?.chainId === '-239' ? 'https://tonapi.io' : 'https://testnet.tonapi.io';
        super(config, defaultEndpoint);
    }

    async getAccountState(address: UserFriendlyAddress, _seqno?: number): Promise<FullAccountState> {
        // Note: seqno parameter is not supported by TonApi /v2/accounts endpoint for historical state queries
        const raw = await this.getJson<TonApiAccount>(`/v2/accounts/${address}`);

        return mapAccountState(raw);
    }

    async getBalance(address: UserFriendlyAddress, seqno?: number): Promise<TokenAmount> {
        const state = await this.getAccountState(address, seqno);

        return state.balance;
    }

    async jettonsByAddress(request: GetJettonsByAddressRequest): Promise<ToncenterResponseJettonMasters> {
        const raw = await this.getJson<TonApiJettonInfo>(`/v2/jettons/${request.address}`);

        return mapJettonMasters(raw);
    }

    async jettonsByOwnerAddress(request: GetJettonsByOwnerRequest): Promise<JettonsResponse> {
        const raw = await this.getJson<TonApiJettonsBalances>(`/v2/accounts/${request.ownerAddress}/jettons`);

        return mapUserJettons(raw);
    }

    async nftItemsByAddress(request: NFTsRequest): Promise<NFTsResponse> {
        if (!request.address) {
            throw new Error('TonApi requires an address to fetch NFT items.');
        }

        const raw = await this.getJson<TonApiNftItem>(`/v2/nfts/${request.address}`);
        return mapNftItemsResponse([raw]);
    }

    async nftItemsByOwner(request: UserNFTsRequest): Promise<NFTsResponse> {
        const query: Record<string, unknown> = {};
        if (request.pagination?.limit) query.limit = request.pagination.limit;
        if (request.pagination?.offset) query.offset = request.pagination.offset;

        const raw = await this.getJson<TonApiNftItems>(`/v2/accounts/${request.ownerAddress}/nfts`, query);
        return mapNftItemsResponse(raw.nft_items);
    }

    async fetchEmulation(_messageBoc: Base64String, _ignoreSignature?: boolean): Promise<ToncenterEmulationResult> {
        throw new Error('Method not implemented.');
    }
    async sendBoc(_boc: Base64String): Promise<string> {
        throw new Error('Method not implemented.');
    }
    async runGetMethod(
        _address: UserFriendlyAddress,
        _method: string,
        _stack?: RawStackItem[],
        _seqno?: number,
    ): Promise<GetMethodResult> {
        throw new Error('Method not implemented.');
    }
    async getAccountTransactions(_request: TransactionsByAddressRequest): Promise<TransactionsResponse> {
        throw new Error('Method not implemented.');
    }
    async getTransactionsByHash(_request: GetTransactionByHashRequest): Promise<TransactionsResponse> {
        throw new Error('Method not implemented.');
    }
    async getPendingTransactions(_request: GetPendingTransactionsRequest): Promise<TransactionsResponse> {
        throw new Error('Method not implemented.');
    }
    async getTrace(_request: GetTraceRequest): Promise<ToncenterTracesResponse> {
        throw new Error('Method not implemented.');
    }
    async getPendingTrace(_request: GetPendingTraceRequest): Promise<ToncenterTracesResponse> {
        throw new Error('Method not implemented.');
    }
    async resolveDnsWallet(_domain: string): Promise<string | null> {
        throw new Error('Method not implemented.');
    }
    async backResolveDnsWallet(_address: UserFriendlyAddress): Promise<string | null> {
        throw new Error('Method not implemented.');
    }
    async getEvents(_request: GetEventsRequest): Promise<GetEventsResponse> {
        throw new Error('Method not implemented.');
    }

    protected appendAuthHeaders(headers: Headers): void {
        if (this.apiKey) {
            headers.set('Authorization', `Bearer ${this.apiKey}`);
        }
    }
}
