import { Address, ExtraCurrency, AccountStatus, TupleItem } from '@ton/core';

import { Base64ToUint8Array, Base64ToBigInt, Uint8ArrayToBase64 } from '../utils/base64';
import { FullAccountState, GetResult, TransactionId } from '../types/toncenter/api';
import { ToncenterEmulationResponse } from '../types';
import { ConnectTransactionParamMessage } from '../types/internal';
import { serializeStack, parseStack, RawStackItem } from '../utils/tvmStack';
import {
    ApiClient,
    GetPendingTransactionsRequest,
    GetTransactionByHashRequest,
    NftItemsByOwnerRequest,
    NftItemsRequest,
    TransactionsByAddressRequest,
} from '../types/toncenter/ApiClient';
import { NftItemsResponseV3, toNftItemsResponse } from '../types/toncenter/v3/NftItemsResponseV3';
import { NftItemsResponse } from '../types/toncenter/NftItemsResponse';
import { Pagination } from '../types/toncenter/Pagination';
import { ToncenterTransactionsResponse } from '../types/toncenter/emulation';

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
    endpoint?: string;
    apiKey?: string;
    timeout?: number;
    fetchApi?: typeof fetch;
}

export class ApiClientToncenter implements ApiClient {
    private readonly endpoint: string;
    private readonly apiKey?: string;
    private readonly timeout: number;
    private readonly fetchApi: typeof fetch;

    constructor(config: ApiClientConfig = {}) {
        this.endpoint = config.endpoint ?? 'https://toncenter.com';
        this.apiKey = config.apiKey;
        this.timeout = config.timeout ?? 30000;
        this.fetchApi = config.fetchApi ?? fetch;
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
        return toNftItemsResponse(response, pagination);
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
        if (typeof boc !== 'string') {
            boc = Uint8ArrayToBase64(boc);
        }
        const response = await this.postJson<V2SendMessageResult>('/api/v3/message', { boc });
        return Base64ToBigInt(response.message_hash_norm).toString(16);
    }

    async runGetMethod(
        address: Address | string,
        method: string,
        stack: TupleItem[] = [],
        seqno?: number,
    ): Promise<GetResult> {
        if (address instanceof Address) {
            address = address.toString();
        }
        const props: Record<string, unknown> = {
            address,
            method,
            stack: serializeStack(stack),
        };
        if (typeof seqno === 'number') props.seqno = seqno;
        const raw = await this.postJson<V3RunGetMethodRequest>('/api/v3/runGetMethod', props);
        return {
            gasUsed: raw.gas_used,
            stack: parseStack(raw.stack),
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
        const code = Base64ToUint8Array(raw.code);
        const data = Base64ToUint8Array(raw.data);
        const out: FullAccountState = {
            status: raw.status,
            balance,
            extraCurrencies,
            code,
            data,
            lastTransaction: parseInternalTransactionId({
                hash: raw.last_transaction_hash,
                lt: raw.last_transaction_lt,
            }),
        };
        if (raw.frozen_hash) {
            out.frozenHash = Base64ToBigInt(raw.frozen_hash);
        }
        return out;
    }

    async getBalance(address: Address | string, seqno?: number): Promise<bigint> {
        return this.getAccountState(address, seqno).then((state) => state.balance);
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
}

const padBase64 = (data: string): string => {
    return data.padEnd(data.length + (4 - data.length % 4), '=');
}

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
            lt: Base64ToBigInt(data.lt),
            hash: Base64ToBigInt(data.hash),
        };
    }
    return null;
}
