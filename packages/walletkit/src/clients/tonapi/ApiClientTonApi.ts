/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

import type {
    ApiClient,
    BulkAccountState,
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
    MasterchainInfo,
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
import { globalLogger } from '../../core/Logger';
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
import type { TonApiMasterchainHeadResponse } from './types/masterchain';
import { mapTonApiGetMethodArgs, mapTonApiTvmStackRecord } from './mappers/map-methods';
import { Base64Normalize, Base64ToBigInt, Base64ToHex, getNormalizedExtMessageHash, isHex } from '../../utils';
import type { TonApiTransactionsResponse, TonApiTransaction } from './types/transactions';
import type { TonApiTrace } from './types/traces';
import type { TonApiAccountEventsResponse } from './types/events';
import { mapTonApiTransaction } from './mappers/map-transactions';
import { mapTonApiTrace, mapTonApiTraceTransaction } from './mappers/map-traces';
import { mapTonApiEvent } from './mappers/map-events';
import { mapMasterchainInfo } from './mappers/map-masterchain-info';

const log = globalLogger.createChild('ApiClientTonApi');

export type TonApiAccountStatus = 'nonexist' | 'uninit' | 'active' | 'frozen';

export interface TonApiEcPreview {
    /** Extra currency ID. Example: 239 */
    id: number;
    /** Currency symbol. Example: "FMS" */
    symbol: string;
    /** Decimal places. Example: 5 */
    decimals: number;
    /** Icon URL. Example: "https://cache.tonapi.io/images/extra.jpg" */
    image: string;
}

export interface TonApiExtraCurrency {
    /** Amount as string (bigint). Example: "1000000000" */
    amount: string;
    preview: TonApiEcPreview;
}

export interface TonApiBulkAccount extends BulkAccountState {
    /** Raw address. Example: "0:da6b1b6663a0e4d18cc8574ccd9db5296e367dd9324706f3bbd9eb1cd2caf0bf" */
    address: string;
    /** Balance in nanocoins. Example: 123456789 */
    balance: number;
    /** Extra currency balances */
    extra_balance?: TonApiExtraCurrency[];
    /** Map of currency code to amount. Example: { "USD": 1, "IDR": 1000 } */
    currencies_balance?: Record<string, number>;
    /** Unix timestamp of last activity. Example: 1720860269 */
    last_activity: number;
    status: TonApiAccountStatus;
    /** List of interfaces implemented by this account. Example: ["nft_sale"] */
    interfaces?: string[];
    /** Display name. Example: "Ton foundation" */
    name?: string;
    /** Whether the account is marked as a scam. Example: true */
    is_scam?: boolean;
    /** Icon URL. Example: "https://ton.org/logo.png" */
    icon?: string;
    /** Whether transactions to this account require a memo. Example: true */
    memo_required?: boolean;
    /** Available GET methods. Example: ["get_item_data"] */
    get_methods: string[];
    /** Whether the account is suspended */
    is_suspended?: boolean;
    /** Whether the account is a wallet */
    is_wallet: boolean;
}

/**
 * @experimental
 * This client implementation is experimental and currently has inconsistencies
 * with the default Toncenter client. Some methods are not yet fully implemented.
 */
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
        try {
            const raw = await this.getJson<TonApiBlockchainAccount>(`/v2/blockchain/accounts/${address}`);

            return mapAccountState(raw);
        } catch (e) {
            // TonApi returns 404 for non-existent accounts
            if (e instanceof TonClientError && e.status === 404) {
                return {
                    status: 'non-existing',
                    balance: '0',
                    extraCurrencies: {},
                    code: null,
                    data: null,
                    lastTransaction: null,
                };
            }
            throw e;
        }
    }

    async getBalance(address: UserFriendlyAddress, seqno?: number): Promise<TokenAmount> {
        const state = await this.getAccountState(address, seqno);

        return state.balance;
    }

    async getBulkAccounts(addresses: string[]): Promise<TonApiBulkAccount[]> {
        const raw = await this.postJson<{ accounts: TonApiBulkAccount[] }>('/v2/accounts/_bulk', {
            account_ids: addresses,
        });

        return raw.accounts;
    }

    async jettonsByAddress(request: GetJettonsByAddressRequest): Promise<ToncenterResponseJettonMasters> {
        const raw = await this.getJson<TonApiJettonInfo>(`/v2/jettons/${request.address}`);

        return mapJettonMasters(raw);
    }

    async jettonsByOwnerAddress(request: GetJettonsByOwnerRequest): Promise<JettonsResponse> {
        const raw = await this.getJson<TonApiJettonsBalances>(
            `/v2/accounts/${this.normalizeAddress(request.ownerAddress)}/jettons?currencies=usd`,
        );

        return mapUserJettons(raw);
    }

    async nftItemsByAddress(request: NFTsRequest): Promise<NFTsResponse> {
        if (!request.address) {
            throw new Error('TonApi requires an address to fetch NFT items.');
        }

        try {
            const raw = await this.getJson<TonApiNftItem>(`/v2/nfts/${this.normalizeAddress(request.address)}`);
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
        if (request.collectionAddress) query.collection = request.collectionAddress;
        if (request.pagination?.limit) query.limit = request.pagination.limit;
        if (request.pagination?.offset) query.offset = request.pagination.offset;

        const raw = await this.getJson<TonApiNftItems>(
            `/v2/accounts/${this.normalizeAddress(request.ownerAddress)}/nfts`,
            query,
        );
        const result = mapNftItemsResponse(raw.nft_items);
        await this.enrichAddressBookWithInterfaces(result);

        return result;
    }

    private async enrichAddressBookWithInterfaces(result: NFTsResponse): Promise<void> {
        if (result.nfts.length === 0) {
            return;
        }

        const addresses = result.nfts.map((nft) => nft.address);
        const addressBook = (result.addressBook ??= {});
        const chunkSize = 100;

        try {
            for (let i = 0; i < addresses.length; i += chunkSize) {
                const chunk = addresses.slice(i, i + chunkSize);
                const bulkRaw = await this.postJson<{ accounts?: TonApiBulkAccount[] }>('/v2/accounts/_bulk', {
                    account_ids: chunk,
                });

                for (const account of bulkRaw.accounts ?? []) {
                    const address = asAddressFriendly(account.address);
                    if (addressBook[address]) {
                        addressBook[address].interfaces = account.interfaces ?? [];
                    } else {
                        addressBook[address] = {
                            address,
                            domain: undefined,
                            interfaces: account.interfaces ?? [],
                        };
                    }
                }
            }
        } catch (error) {
            log.warn('Failed to enrich NFT address book with interfaces', { error });
        }
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

    async getAccountTransactions(request: TransactionsByAddressRequest): Promise<TransactionsResponse> {
        const address = request.address?.[0];
        if (!address) {
            return { transactions: [], addressBook: {} };
        }

        const limit = Math.max(1, Math.min(request.limit ?? 10, 100));
        const offset = Math.max(0, request.offset ?? 0);

        const response = await this.getJson<TonApiTransactionsResponse>(
            `/v2/blockchain/accounts/${address}/transactions`,
            {
                limit,
                offset,
                sort_order: 'desc',
            },
        );

        const transactions = (response.transactions ?? []).map(mapTonApiTransaction);

        return {
            transactions,
            addressBook: {},
        };
    }

    async getTransactionsByHash(request: GetTransactionByHashRequest): Promise<TransactionsResponse> {
        const isMessageHash = 'msgHash' in request;
        const requestHash = isMessageHash ? request.msgHash : request.bodyHash;
        const normalizedHash = this.normalizeTonApiId(requestHash);

        const byTransaction = async () =>
            this.getJson<TonApiTransaction>(`/v2/blockchain/transactions/${normalizedHash}`);
        const byMessage = async () =>
            this.getJson<TonApiTransaction>(`/v2/blockchain/messages/${normalizedHash}/transaction`);

        const primaryRequest = isMessageHash ? byMessage : byTransaction;
        const fallbackRequest = isMessageHash ? byTransaction : byMessage;

        let tx: TonApiTransaction;
        try {
            tx = await primaryRequest();
        } catch (error) {
            if (!(error instanceof TonClientError) || error.status !== 404) {
                throw error;
            }
            tx = await fallbackRequest();
        }

        return {
            transactions: [mapTonApiTransaction(tx)],
            addressBook: {},
        };
    }

    async getPendingTransactions(_request: GetPendingTransactionsRequest): Promise<TransactionsResponse> {
        // TonAPI doesn't expose Toncenter-like pending transaction list.
        // Returning an empty list keeps compatibility with existing consumers.
        return {
            transactions: [],
            addressBook: {},
        };
    }

    async getTrace(request: GetTraceRequest): Promise<ToncenterTracesResponse> {
        const candidates = request.traceId && request.traceId.length > 0 ? request.traceId : [];
        if (request.account) {
            candidates.push(String(request.account));
        }

        for (const candidate of candidates) {
            const traceId = this.normalizeTonApiId(candidate);
            try {
                const trace = await this.getJson<TonApiTrace>(`/v2/traces/${traceId}`);
                return mapTonApiTrace(trace, mapTonApiTraceTransaction);
            } catch (error) {
                if (error instanceof TonClientError && error.status === 404) {
                    continue;
                }
                throw error;
            }
        }

        throw new Error('Failed to fetch trace');
    }

    async getPendingTrace(request: GetPendingTraceRequest): Promise<ToncenterTracesResponse> {
        for (const messageHash of request.externalMessageHash) {
            const normalizedHash = this.normalizeTonApiId(messageHash);
            try {
                const tx = await this.getJson<TonApiTransaction>(
                    `/v2/blockchain/messages/${normalizedHash}/transaction`,
                );
                return await this.getTrace({ traceId: [tx.hash] });
            } catch (error) {
                if (error instanceof TonClientError && error.status === 404) {
                    continue;
                }
                throw error;
            }
        }

        throw new Error('Failed to fetch pending trace');
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

    async getEvents(request: GetEventsRequest): Promise<GetEventsResponse> {
        const account = String(request.account);
        const limit = Math.max(1, Math.min(request.limit ?? 20, 100));
        const offset = Math.max(0, request.offset ?? 0);

        const response = await this.getJson<TonApiAccountEventsResponse>(`/v2/accounts/${account}/events`, {
            limit,
            offset,
            sort_order: 'desc',
            i18n: 'en',
        });

        const pageEvents = response.events ?? [];

        return {
            events: pageEvents.map(mapTonApiEvent),
            offset,
            limit,
            hasNext: Number(response.next_from ?? 0) > 0 || pageEvents.length >= limit,
        };
    }

    async getMasterchainInfo(): Promise<MasterchainInfo> {
        const raw = await this.getJson<TonApiMasterchainHeadResponse>(`/v2/blockchain/masterchain-head`);
        return mapMasterchainInfo(raw);
    }

    protected appendAuthHeaders(headers: Headers): void {
        if (this.apiKey) {
            headers.set('Authorization', `Bearer ${this.apiKey}`);
        }
    }

    private normalizeTonApiId(value: string): string {
        const normalizedValue = value.trim();
        if (!normalizedValue) {
            throw new Error('Invalid TonAPI id: value is required');
        }

        if (isHex(normalizedValue)) {
            return normalizedValue.toLowerCase();
        }

        if (/^[0-9a-fA-F]+$/.test(normalizedValue) && normalizedValue.length % 2 === 0) {
            return `0x${normalizedValue.toLowerCase()}`;
        }

        const normalizedBase64 = Base64Normalize(normalizedValue);
        return Base64ToHex(normalizedBase64).toLowerCase();
    }

    private normalizeAddress(address: string | Address): string {
        try {
            if (address instanceof Address) {
                return address.toString();
            }
            return Address.parse(address).toString();
        } catch {
            return address.toString();
        }
    }
}
