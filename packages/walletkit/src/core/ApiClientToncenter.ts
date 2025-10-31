/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address, ExtraCurrency, AccountStatus } from '@ton/core';
import { CHAIN } from '@tonconnect/protocol';

import { Base64ToBigInt, Uint8ArrayToBase64, Base64Normalize, Base64ToHex } from '../utils/base64';
import { FullAccountState, GetResult, TransactionId } from '../types/toncenter/api';
import { ToncenterEmulationResponse } from '../types';
import { ConnectTransactionParamMessage } from '../types/internal';
import { RawStackItem } from '../utils/tvmStack';
import {
    ApiClient,
    GetJettonsByOwnerRequest,
    GetJettonsByAddressRequest,
    GetPendingTraceRequest,
    GetPendingTransactionsRequest,
    GetTraceRequest,
    GetTransactionByHashRequest,
    NftItemsByOwnerRequest,
    NftItemsRequest,
    TransactionsByAddressRequest,
} from '../types/toncenter/ApiClient';
import { NftItemsResponseV3, toNftItemsResponse } from '../types/toncenter/v3/NftItemsResponseV3';
import { NftItemsResponse } from '../types/toncenter/NftItemsResponse';
import { Pagination } from '../types/toncenter/Pagination';
import {
    ToncenterResponseJettonMasters,
    ToncenterResponseJettonWallets,
    ToncenterTracesResponse,
    ToncenterTransactionsResponse,
    EmulationTokenInfoMasters,
} from '../types/toncenter/emulation';
import { ResponseUserJettons } from '../types/export/responses/jettons';
import { AddressJetton, JettonInfo } from '../types/jettons';
import { CallForSuccess } from '../utils/retry';
import { globalLogger } from './Logger';
import { DNSRecordsResponseV3, toDnsRecords } from '../types/toncenter/v3/DNSRecordsResponseV3';
import {
    DnsCategory,
    dnsResolve,
    ROOT_DNS_RESOLVER_MAINNET,
    ROOT_DNS_RESOLVER_TESTNET,
} from '../types/toncenter/dnsResolve';

const log = globalLogger.createChild('ApiClientToncenter');

export class TonClientError extends Error {
    public readonly status: number;
    public readonly details?: unknown;

    constructor(message: string, status: number, details?: unknown) {
        super(message);
        this.name = 'TonClientError';
        this.status = status;
        this.details = details;
    }
}

export interface ApiClientConfig {
    dnsResolver?: string;
    endpoint?: string;
    apiKey?: string;
    timeout?: number;
    fetchApi?: typeof fetch;
    network?: CHAIN;
    disableNetworkSend?: boolean;
}

export class ApiClientToncenter implements ApiClient {
    private readonly dnsResolver: string;
    private readonly endpoint: string;
    private readonly apiKey?: string;
    private readonly timeout: number;
    private readonly fetchApi: typeof fetch;
    private readonly network?: CHAIN;
    private readonly disableNetworkSend?: boolean;

    constructor(config: ApiClientConfig = {}) {
        this.network = config.network;

        const dnsResolver = this.network === CHAIN.MAINNET ? ROOT_DNS_RESOLVER_MAINNET : ROOT_DNS_RESOLVER_TESTNET;
        const defaultEndpoint =
            this.network === CHAIN.MAINNET ? 'https://toncenter.com' : 'https://testnet.toncenter.com';

        this.dnsResolver = config.dnsResolver ?? dnsResolver;
        this.endpoint = config.endpoint ?? defaultEndpoint;
        this.apiKey = config.apiKey;
        this.timeout = config.timeout ?? 30000;
        this.fetchApi = config.fetchApi ?? fetch;
        this.disableNetworkSend = config.disableNetworkSend ?? false;
    }

    async nftItemsByAddress(request: NftItemsRequest): Promise<NftItemsResponse> {
        const props: Record<string, unknown> = {
            address: (request.address ?? []).map(prepareAddress),
        };
        const response = await this.getJson<NftItemsResponseV3>('/api/v3/nft/items', props);
        return toNftItemsResponse(response, {
            limit: 0,
            offset: 0,
        });
    }

    async nftItemsByOwner(request: NftItemsByOwnerRequest): Promise<NftItemsResponse> {
        const pagination: Pagination = {
            limit: request.limit ?? 10,
            offset: request.offset ?? 0,
        };
        const props: Record<string, unknown> = {
            owner_address: (request.ownerAddress ?? []).map(prepareAddress),
            sort_by_last_transaction_lt: request.sortByLastTransactionLt ?? false,
            limit: pagination.limit,
            offset: pagination.offset,
        };
        const response = await this.getJson<NftItemsResponseV3>('/api/v3/nft/items', props);
        const formattedResponse = toNftItemsResponse(response, pagination);
        return formattedResponse;
    }

    async fetchEmulation(
        address: Address | string,
        messages: ConnectTransactionParamMessage[],
        seqno?: number,
    ): Promise<ToncenterEmulationResponse> {
        if (address instanceof Address) {
            address = address.toString();
        }
        const props: Record<string, unknown> = {
            from: address,
            valid_until: Math.floor(Date.now() / 1000) + 60,
            include_code_data: true,
            include_address_book: true,
            include_metadata: true,
            with_actions: true,
            messages,
        };
        if (typeof seqno === 'number') props.mc_block_seqno = seqno;
        return this.postJson<ToncenterEmulationResponse>('/api/emulate/v1/emulateTonConnect', props);
    }

    async sendBoc(boc: string | Uint8Array): Promise<string> {
        if (this.disableNetworkSend) {
            return '';
        }
        if (typeof boc !== 'string') {
            boc = Uint8ArrayToBase64(boc);
        }
        const response = await this.postJson<V2SendMessageResult>('/api/v3/message', { boc });
        return Base64ToBigInt(response.message_hash_norm).toString(16);
    }

    async runGetMethod(
        address: Address | string,
        method: string,
        stack: RawStackItem[] = [],
        seqno?: number,
    ): Promise<GetResult> {
        if (address instanceof Address) {
            address = address.toString();
        }
        const props: Record<string, unknown> = {
            address,
            method,
            stack: stack, //serializeStack(stack),
        };
        if (typeof seqno === 'number') props.seqno = seqno;
        const raw = await this.postJson<V3RunGetMethodRequest>('/api/v3/runGetMethod', props);
        return {
            gasUsed: raw.gas_used,
            stack: raw.stack,
            exitCode: raw.exit_code,
        };
    }

    async getAccountState(address: Address | string, seqno?: number): Promise<FullAccountState> {
        if (address instanceof Address) {
            address = address.toString();
        }
        const query: Record<string, unknown> = { include_boc: true, address: [address] };
        if (typeof seqno === 'number') query.seqno = seqno.toString();
        const raw = await this.getJson<V2AddressInformation>('/api/v3/addressInformation', query);
        const balance = BigInt(raw.balance);
        const extraCurrencies: ExtraCurrency = {};
        for (const currency of raw.extra_currencies || []) {
            extraCurrencies[currency.id] = BigInt(currency.amount);
        }
        // const code = Base64ToUint8Array(raw.code);
        // const data = Base64ToUint8Array(raw.data);
        const out: FullAccountState = {
            status: raw.status,
            balance: balance.toString(),
            extraCurrencies,
            code: raw.code,
            data: raw.data,
            lastTransaction: parseInternalTransactionId({
                hash: raw.last_transaction_hash,
                lt: raw.last_transaction_lt,
            }),
        };
        if (raw.frozen_hash) {
            out.frozenHash = Base64ToHex(raw.frozen_hash) ?? undefined;
        }
        return out;
    }

    async getBalance(address: Address | string, seqno?: number): Promise<string> {
        return (await this.getAccountState(address, seqno)).balance;
    }

    private async doRequest(url: URL, init: globalThis.RequestInit = {}): Promise<globalThis.Response> {
        const fetchFn = this.fetchApi;

        if (!this.timeout || this.timeout <= 0) {
            return fetchFn(url, init);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            return await fetchFn(url, { ...init, signal: controller.signal });
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private async fetch<T>(url: URL, props: globalThis.RequestInit = {}): Promise<T> {
        const headers = new Headers(props.headers);
        headers.set('accept', 'application/json');
        if (this.apiKey) headers.set('x-api-key', this.apiKey);
        props = { ...props, headers };
        const response = await this.doRequest(url, props);
        if (!response.ok) {
            throw await this.buildError(response);
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            const text = await (response as globalThis.Response).text();
            throw new TonClientError('Unexpected non-JSON response', response.status, text.slice(0, 200));
        }
        const json = await response.json();
        return json as Promise<T>;
    }

    private async getJson<T>(path: string, query?: Record<string, unknown>): Promise<T> {
        return this.fetch(this.buildUrl(path, query), { method: 'GET' });
    }

    private async postJson<T>(path: string, props: unknown): Promise<T> {
        return this.fetch(this.buildUrl(path), {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(props),
        });
    }

    private buildUrl(path: string, query: Record<string, unknown> = {}): URL {
        const url = new URL(path.replace(/^\/*/, '/'), this.endpoint);
        for (const [key, value] of Object.entries(query)) {
            if (typeof value === 'string') url.searchParams.set(key, value);
            else if (Array.isArray(value)) {
                for (const item of value) {
                    if (typeof item === 'string') url.searchParams.set(key, item);
                    else if (item != null && typeof item.toString === 'function') {
                        url.searchParams.set(key, item.toString());
                    }
                }
            } else if (value != null && typeof value.toString === 'function') {
                url.searchParams.set(key, value.toString());
            }
        }
        return url;
    }

    private async buildError(response: globalThis.Response): Promise<Error> {
        const message = response.statusText || 'HTTP Error';
        const code = response.status ?? 500;
        let detail: unknown;
        try {
            detail = await response.json();
        } catch {
            /* empty */
        }
        return new TonClientError(`HTTP ${response.status}: ${message}`, code, detail);
    }

    async getAccountTransactions(request: TransactionsByAddressRequest): Promise<ToncenterTransactionsResponse> {
        const accounts = request.address?.map(prepareAddress);
        let offset = request.offset ?? 0;
        let limit = request.limit ?? 10;
        if (limit > 100) {
            limit = 100;
        } else if (limit < 0) {
            limit = 0;
        }
        if (offset < 0) {
            offset = 0;
        }
        const response = await this.getJson<ToncenterTransactionsResponse>('/api/v3/transactions', {
            account: accounts,
            limit,
            offset,
        });
        return response;
    }

    async getTransactionsByHash(request: GetTransactionByHashRequest): Promise<ToncenterTransactionsResponse> {
        const msgHash = 'msgHash' in request ? padBase64(request.msgHash) : undefined;
        const bodyHash = 'bodyHash' in request ? padBase64(request.bodyHash) : undefined;

        const response = await this.getJson<ToncenterTransactionsResponse>('/api/v3/transactionsByMessage', {
            msg_hash: msgHash ? [msgHash] : undefined,
            body_hash: bodyHash ? [bodyHash] : undefined,
        });
        return response;
    }

    async getPendingTransactions(request: GetPendingTransactionsRequest): Promise<ToncenterTransactionsResponse> {
        const accounts = 'accounts' in request ? request.accounts?.map(prepareAddress) : undefined;
        const traceId = 'traceId' in request ? request.traceId : undefined;
        const response = await this.getJson<ToncenterTransactionsResponse>('/api/v3/pendingTransactions', {
            account: accounts,
            trace_id: traceId,
        });
        return response;
    }

    async getTrace(request: GetTraceRequest): Promise<ToncenterTracesResponse> {
        const inTraceId = request.traceId ? request.traceId[0] : undefined;

        const traceId = padBase64(Base64Normalize(inTraceId || '').replace(/=/g, ''));

        try {
            const response = await CallForSuccess(() =>
                this.getJson<ToncenterTracesResponse>('/api/v3/traces', {
                    tx_hash: traceId,
                }),
            );
            if (response.traces.length > 0) {
                return response;
            }
        } catch (error) {
            log.error('Error fetching trace', { error });
        }

        try {
            const response = await CallForSuccess(() =>
                this.getJson<ToncenterTracesResponse>('/api/v3/traces', {
                    trace_id: traceId,
                }),
            );

            if (response.traces.length > 0) {
                return response;
            }
        } catch (error) {
            log.error('Error fetching trace', { error });
        }

        try {
            const response = await CallForSuccess(() =>
                this.getJson<ToncenterTracesResponse>('/api/v3/traces', {
                    msg_hash: traceId,
                }),
            );
            if (response.traces.length > 0) {
                return response;
            }
        } catch (error) {
            log.error('Error fetching pending trace', { error });
        }

        throw new Error('Failed to fetch trace');
    }

    async getPendingTrace(request: GetPendingTraceRequest): Promise<ToncenterTracesResponse> {
        try {
            const response = await CallForSuccess(() =>
                this.getJson<ToncenterTracesResponse>('/api/v3/pendingTraces', {
                    ext_msg_hash: request.externalMessageHash,
                }),
            );
            if (response.traces.length > 0) {
                return response;
            }
        } catch (error) {
            log.error('Error fetching pending trace', { error });
        }

        throw new Error('Failed to fetch pending trace');
    }

    async resolveDnsWallet(domain: string): Promise<string | null> {
        const result = await dnsResolve(this, domain, DnsCategory.Wallet, this.dnsResolver);
        if (result && result.value) {
            return result.value;
        }
        return null;
    }

    async backResolveDnsWallet(wallet: Address | string): Promise<string | null> {
        if (wallet instanceof Address) {
            wallet = wallet.toString();
        }
        const response = toDnsRecords(
            await this.getJson<DNSRecordsResponseV3>('/api/v3/dns/records', {
                wallet,
                limit: 1,
                offset: 0,
            }),
        );
        if (response.records.length > 0) {
            return response.records[0].domain;
        }
        return null;
    }

    async jettonsByAddress(request: GetJettonsByAddressRequest): Promise<ToncenterResponseJettonMasters> {
        return this.getJson<ToncenterResponseJettonMasters>('/api/v3/jetton/masters', {
            address: request.address,
            offset: request.offset,
            limit: request.limit,
        });
    }

    async jettonsByOwnerAddress(request: GetJettonsByOwnerRequest): Promise<ResponseUserJettons> {
        const offset = request.offset ?? 0;
        const limit = request.limit ?? 50;
        const rawResponse = await this.getJson<ToncenterResponseJettonWallets>('/api/v3/jetton/wallets', {
            owner_address: request.ownerAddress,
            offset,
            limit,
        });

        return this.mapToResponseUserJettons(rawResponse, offset, limit);
    }

    private mapToResponseUserJettons(
        rawResponse: ToncenterResponseJettonWallets,
        offset: number,
        limit: number,
    ): ResponseUserJettons {
        const userJettons: AddressJetton[] = rawResponse.jetton_wallets.map((wallet) => {
            const jettonInfo = this.extractJettonInfoFromMetadata(wallet.jetton, rawResponse.metadata);
            return {
                address: wallet.jetton,
                balance: wallet.balance,
                jettonWalletAddress: wallet.address,
                usdValue: '0',
                name: jettonInfo.name,
                symbol: jettonInfo.symbol,
                description: jettonInfo.description,
                decimals: jettonInfo.decimals,
                image: jettonInfo.image,
                verification: jettonInfo.verification,
                metadata: jettonInfo.metadata,
                totalSupply: jettonInfo.totalSupply,
                uri: jettonInfo.uri,
                image_data: jettonInfo.image_data,
                lastActivity: wallet.last_transaction_lt,
            };
        });

        return {
            jettons: userJettons,
            address_book: rawResponse.address_book,
            pagination: {
                offset,
                limit,
            },
        };
    }

    private extractJettonInfoFromMetadata(
        jettonAddress: string,
        metadata: Record<string, { is_indexed: boolean; token_info?: unknown[] }>,
    ): JettonInfo {
        const jettonMetadata = metadata[jettonAddress];
        const metadataJettonInfo = jettonMetadata?.token_info?.find(
            (info: unknown) =>
                typeof info === 'object' &&
                info !== null &&
                'type' in info &&
                (info as { type: string }).type === 'jetton_masters',
        ) as EmulationTokenInfoMasters | undefined;

        if (metadataJettonInfo) {
            const decimals =
                typeof metadataJettonInfo.extra.decimals === 'string'
                    ? parseInt(metadataJettonInfo.extra.decimals, 10)
                    : ((metadataJettonInfo.extra.decimals as number) ?? 9);

            return {
                address: jettonAddress,
                name: metadataJettonInfo.name ?? '',
                symbol: metadataJettonInfo.symbol ?? '',
                description: metadataJettonInfo.description ?? '',
                decimals,
                image: metadataJettonInfo.image,
                image_data: metadataJettonInfo.extra.image_data,
                uri: metadataJettonInfo.extra.uri,
            };
        }

        // Return default/empty jetton info if metadata is not available
        return {
            address: jettonAddress,
            name: '',
            symbol: '',
            description: '',
            decimals: 9,
        };
    }
}

const padBase64 = (data: string): string => {
    return data.padEnd(data.length + (4 - (data.length % 4)), '=');
};

function prepareAddress(address: Address | string): string {
    if (address instanceof Address) {
        address = address.toString();
    }
    return address;
}

interface InternalTransactionId {
    lt: string;
    hash: string;
}
interface TonBlockIdExt {
    workchain: number;
    shard: string;
    seqno: number;
    root_hash: string;
    file_hash: string;
}
interface V2AddressInformation {
    balance: string;
    code: string;
    data: string;
    frozen_hash: string;
    last_transaction_hash: string;
    last_transaction_lt: string;
    status: AccountStatus;
    extra_currencies?: Array<{
        id: number;
        amount: string;
    }>;
    block_id?: TonBlockIdExt;
}
interface V3RunGetMethodRequest {
    gas_used: number;
    stack: RawStackItem[];
    exit_code: number;
}
interface V2SendMessageResult {
    message_hash: string;
    message_hash_norm: string;
}

function parseInternalTransactionId(data: InternalTransactionId): TransactionId | null {
    if (data.hash !== 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=') {
        return {
            lt: data.lt,
            hash: Base64ToHex(data.hash),
        };
    }
    return null;
}
