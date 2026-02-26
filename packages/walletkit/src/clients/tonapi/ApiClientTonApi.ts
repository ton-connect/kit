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
import { Network } from '../../api/models';
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
import { TonClientError } from '../TonClientError';
import type { TonApiBlockchainAccount } from './types/accounts';
import { asAddressFriendly } from '../../utils/address';
import { mapAccountState } from './mappers/map-account-state';
import { mapJettonMasters } from './mappers/map-jetton-masters';
import { mapUserJettons } from './mappers/map-user-jettons';
import { mapNftItemsResponse } from './mappers/map-nft-items';
import type { TonApiJettonInfo, TonApiJettonsBalances } from './types/jettons';
import type { TonApiNftItems, TonApiNftItem } from './types/nfts';
import type { TonApiDnsResolveResponse, TonApiDnsBackresolveResponse } from './types/dns';
import type { TonApiMethodExecutionResult } from './types/methods';
import { mapTonApiGetMethodArgs, mapTonApiTvmStackRecord } from './mappers/map-methods';
import { Base64ToBigInt, getNormalizedExtMessageHash } from '../../utils';
export class ApiClientTonApi extends BaseApiClient implements ApiClient {
    constructor(config: BaseApiClientConfig = {}) {
        let defaultEndpoint: string;

        switch (config.network?.chainId) {
            case Network.mainnet().chainId:
                defaultEndpoint = 'https://tonapi.io';
                break;
            case Network.tetra().chainId:
                defaultEndpoint = 'https://tetra.tonapi.io';
                break;
            default:
                defaultEndpoint = 'https://testnet.tonapi.io';
                break;
        }

        super(config, defaultEndpoint);
    }

    async getAccountState(address: UserFriendlyAddress, _seqno?: number): Promise<FullAccountState> {
        // Note: seqno parameter is not supported by TonApi /v2/accounts endpoint for historical state queries
        const raw = await this.getJson<TonApiBlockchainAccount>(`/v2/blockchain/accounts/${address}`);

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

        try {
            const raw = await this.getJson<TonApiNftItem>(`/v2/nfts/${request.address}`);
            return mapNftItemsResponse([raw]);
        } catch (e) {
            if (e instanceof TonClientError && e.status === 404) {
                return { addressBook: {}, nfts: [] };
            }
            throw e;
        }
    }

    async nftItemsByOwner(request: UserNFTsRequest): Promise<NFTsResponse> {
        const query: Record<string, unknown> = {};
        if (request.pagination?.limit) query.limit = request.pagination.limit;
        if (request.pagination?.offset) query.offset = request.pagination.offset;

        const raw = await this.getJson<TonApiNftItems>(`/v2/accounts/${request.ownerAddress}/nfts`, query);
        return mapNftItemsResponse(raw.nft_items);
    }

    async sendBoc(boc: Base64String): Promise<string> {
        if (this.disableNetworkSend) {
            return '';
        }

        await this.postJson('/v2/liteserver/send_message', { body: boc });
        const { hash } = getNormalizedExtMessageHash(boc);

        return Base64ToBigInt(hash).toString(16);
    }

    async fetchEmulation(_messageBoc: Base64String, _ignoreSignature?: boolean): Promise<ToncenterEmulationResult> {
        throw new Error('Method not implemented.');
    }

    async runGetMethod(
        address: UserFriendlyAddress,
        method: string,
        stack?: RawStackItem[],
        _seqno?: number,
    ): Promise<GetMethodResult> {
        const args = mapTonApiGetMethodArgs(stack);

        const raw = await this.postJson<TonApiMethodExecutionResult>(
            `/v2/blockchain/accounts/${address}/methods/${method}`,
            { args },
        );

        if (!raw.success) {
            throw new Error(`TonApi runGetMethod '${method}' failed with exit code ${raw.exit_code}`);
        }

        return {
            // TonApi does not return gas_used
            gasUsed: 0,
            exitCode: raw.exit_code,
            stack: (raw.stack || []).map(mapTonApiTvmStackRecord),
        };
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

    async resolveDnsWallet(domain: string): Promise<string | null> {
        try {
            const raw = await this.getJson<TonApiDnsResolveResponse>(`/v2/dns/${domain}/resolve`);
            const address = raw?.wallet?.address;

            return address ? asAddressFriendly(address) : null;
        } catch (_e) {
            return null;
        }
    }

    async backResolveDnsWallet(address: UserFriendlyAddress): Promise<string | null> {
        try {
            const raw = await this.getJson<TonApiDnsBackresolveResponse>(`/v2/accounts/${address}/dns/backresolve`);
            return raw.domains && raw.domains.length > 0 ? raw.domains[0] : null;
        } catch (_e) {
            return null;
        }
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
