import { Address, Cell, ExtraCurrency, loadMessage, Message, TupleItem, TupleReader } from '@ton/core';

import { base64ToUint8Array, base64ToBigInt, uint8ArrayToBase64 } from '../utils/base64';
import { BlockId, EstimateFeeResult, FullAccountState, GetResult, TransactionId } from '../types/toncenter/api';
import { ToncenterEmulationResponse } from '../types';
import { ConnectTransactionParamMessage } from '../types/internal';
import { ApiToncenter } from '../types/toncenter/ApiClientToncenter';

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

export function toMessage(msg: Message | Cell | string): Message {
    if (typeof msg === 'string') {
        msg = Cell.fromBase64(msg);
    }
    if (msg instanceof Cell) {
        msg = loadMessage(msg.asSlice());
    }
    return msg;
}

export class ApiClient implements ApiToncenter {
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
            boc = uint8ArrayToBase64(boc);
        }
        const response = await this.postJson<V2SendMessageResult>('/api/v3/message', { boc });
        return base64ToBigInt(response.message_hash_norm).toString(16);
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
        const response = await this.postJson<RunGetMethodResponse>('/api/v2/runGetMethod', props);
        if (!response.ok) throw new TonClientError(response.error, response.code, response);

        const raw = response.result;
        return {
            gasUsed: raw.gas_used,
            stack: parseStack(raw.stack),
            exitCode: raw.exit_code,
            lastTransaction: parseInternalTransactionId(raw.last_transaction_id),
            blockId: parseRawBlockId(raw.block_id),
        };
    }

    async estimateFee(msg: Message | Cell | string, checkSignature = false): Promise<EstimateFeeResult> {
        const { info, body, init } = toMessage(msg);
        if (!info.dest) {
            throw new TonClientError('not set address destination', 400);
        }
        const props: Record<string, unknown> = {
            address: info.dest.toString(),
            body: body.toBoc().toString('base64'),
            init_code: '',
            init_data: '',
            ignore_chksig: !checkSignature,
        };
        if (init) {
            props.init_code = init.code?.toBoc().toString('base64');
            props.init_data = init.data?.toBoc().toString('base64');
        }
        const response = await this.postJson<EstimateFeeResponse>('/api/v2/estimateFee', props);
        if (!response.ok) throw new TonClientError(response.error, response.code, response);

        const { source_fees, destination_fees } = response.result;
        return {
            sourceFees: {
                fwdFee: source_fees.fwd_fee,
                gasFee: source_fees.gas_fee,
                inFwdFee: source_fees.in_fwd_fee,
                storageFee: source_fees.storage_fee,
            },
            destinationFees: destination_fees.map((it) => {
                return {
                    fwdFee: it.fwd_fee,
                    gasFee: it.gas_fee,
                    inFwdFee: it.in_fwd_fee,
                    storageFee: it.storage_fee,
                };
            }),
        };
    }

    async getAccountState(address: Address | string, seqno?: number): Promise<FullAccountState> {
        if (address instanceof Address) {
            address = address.toString();
        }
        const query: Record<string, string> = { address };
        if (typeof seqno === 'number') query.seqno = seqno.toString();
        const response = await this.getJson<GetAccountStateResponse>('/api/v2/getAddressInformation', query);

        if (!response.ok) throw new TonClientError(response.error, response.code, response);

        const raw = response.result;
        const balance = BigInt(raw.balance);
        const extraCurrencies: ExtraCurrency = {};
        for (const currency of raw.extra_currencies || []) {
            extraCurrencies[currency.id] = BigInt(currency.amount);
        }
        const code = base64ToUint8Array(raw.code);
        const data = base64ToUint8Array(raw.data);
        const out: FullAccountState = {
            state: raw.state,
            balance,
            extraCurrencies,
            code,
            data,
            lastTransaction: parseInternalTransactionId(raw.last_transaction_id),
            blockId: parseRawBlockId(raw.block_id),
            timestampt: raw.sync_utime,
        };
        if (raw.frozen_hash) {
            out.frozenHash = base64ToBigInt(raw.frozen_hash);
        }
        return out;
    }

    getBalance(address: Address | string, seqno?: number): Promise<bigint> {
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

    private async getJson<T>(path: string, query?: Record<string, string>): Promise<T> {
        return this.fetch(this.buildUrl(path, query), { method: 'GET' });
    }

    private async postJson<T>(path: string, props: unknown): Promise<T> {
        return this.fetch(this.buildUrl(path), {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(props),
        });
    }

    private buildUrl(path: string, query: Record<string, string> = {}): URL {
        const url = new URL(path.replace(/^\/*/, '/'), this.endpoint);
        for (const [key, value] of Object.entries(query)) {
            if (typeof value !== 'undefined') url.searchParams.set(key, value);
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
}

type ResponseSuccess<T> = { ok: true; result: T };
type ResponseFailure = { ok: false; error: string; code: number };
type Response<T> = ResponseSuccess<T> | ResponseFailure;
type AccountState = 'active' | 'uninitialized' | 'frozen';
interface InternalTransactionId {
    '@type': 'internal.transactionId';
    lt: string;
    hash: string;
}
interface TonBlockIdExt {
    '@type': 'ton.blockIdExt';
    workchain: number;
    shard: string;
    seqno: number;
    root_hash: string;
    file_hash: string;
}
interface RawAddressInformation {
    '@type': 'raw.fullAccountState';
    state: AccountState;
    balance: string;
    code: string;
    data: string;
    extra_currencies: Array<{
        id: number;
        amount: string;
    }>;
    last_transaction_id: InternalTransactionId;
    block_id: TonBlockIdExt;
    frozen_hash: string;
    sync_utime: number;
    '@extra': string;
}
interface SmcRunResult {
    '@type': 'smc.runResult';
    gas_used: number;
    stack: unknown[];
    exit_code: number;
    block_id: TonBlockIdExt;
    last_transaction_id: InternalTransactionId;
    '@extra': string;
}
interface V2EstimatedFee {
    fwd_fee: number;
    gas_fee: number;
    in_fwd_fee: number;
    storage_fee: number;
}
interface V2EstimateFeeResult {
    source_fees: V2EstimatedFee;
    destination_fees: V2EstimatedFee[];
}
interface V2SendMessageResult {
    message_hash: string;
    message_hash_norm: string;
}
type GetAccountStateResponse = Response<RawAddressInformation>;
type RunGetMethodResponse = Response<SmcRunResult>;
type EstimateFeeResponse = Response<V2EstimateFeeResult>;

type TvmStackEntry =
    | { '@type': 'tvm.list' | 'tvm.tuple'; elements: TvmStackEntry[] }
    | { '@type': 'tvm.cell' | 'tvm.slice'; bytes: string }
    | { '@type': 'tvm.stackEntryCell'; cell: TvmStackEntry }
    | { '@type': 'tvm.stackEntrySlice'; slice: TvmStackEntry }
    | { '@type': 'tvm.stackEntryTuple'; tuple: TvmStackEntry }
    | { '@type': 'tvm.stackEntryList'; list: TvmStackEntry }
    | { '@type': 'tvm.stackEntryNumber'; number: { '@type': 'tvm.numberDecimal'; number: string } }
    | { '@type': 'tvm.numberDecimal'; number: string };

function parseStackEntry(x: TvmStackEntry): unknown {
    const typeName = (x as { ['@type']: string })['@type'];
    switch (typeName) {
        case 'tvm.list':
        case 'tvm.tuple':
            return (x as Extract<TvmStackEntry, { elements: unknown[] }>).elements.map((e) =>
                parseStackEntry(e as TvmStackEntry),
            );
        case 'tvm.cell':
            return Cell.fromBoc(Buffer.from((x as Extract<TvmStackEntry, { bytes: string }>).bytes, 'base64'))[0];
        case 'tvm.slice':
            return Cell.fromBoc(Buffer.from((x as Extract<TvmStackEntry, { bytes: string }>).bytes, 'base64'))[0];
        case 'tvm.stackEntryCell':
            return parseStackEntry((x as Extract<TvmStackEntry, { cell: TvmStackEntry }>).cell);
        case 'tvm.stackEntrySlice':
            return parseStackEntry((x as Extract<TvmStackEntry, { slice: TvmStackEntry }>).slice);
        case 'tvm.stackEntryTuple':
            return parseStackEntry((x as Extract<TvmStackEntry, { tuple: TvmStackEntry }>).tuple);
        case 'tvm.stackEntryList':
            return parseStackEntry((x as Extract<TvmStackEntry, { list: TvmStackEntry }>).list);
        case 'tvm.stackEntryNumber':
            return parseStackEntry((x as Extract<TvmStackEntry, { number: TvmStackEntry }>).number);
        case 'tvm.numberDecimal':
            return BigInt((x as Extract<TvmStackEntry, { number: string }>).number);
        default:
            throw Error('Unsupported item type: ' + typeName);
    }
}

type RawStackItem =
    | ['num', string]
    | ['null']
    | ['cell', { bytes: string }]
    | ['slice', { bytes: string }]
    | ['builder', { bytes: string }]
    | ['tuple', { elements: TvmStackEntry[] }]
    | ['list', { elements: TvmStackEntry[] }];

function parseStackItem(item: RawStackItem): TupleItem {
    if (item[0] === 'num') {
        let val = item[1];
        if (val.startsWith('-')) {
            return { type: 'int', value: -BigInt(val.slice(1)) };
        } else {
            return { type: 'int', value: BigInt(val) };
        }
    } else if (item[0] === 'null') {
        return { type: 'null' };
    } else if (item[0] === 'cell') {
        return { type: 'cell', cell: Cell.fromBoc(Buffer.from(item[1].bytes, 'base64'))[0] };
    } else if (item[0] === 'slice') {
        return { type: 'slice', cell: Cell.fromBoc(Buffer.from(item[1].bytes, 'base64'))[0] };
    } else if (item[0] === 'builder') {
        return { type: 'builder', cell: Cell.fromBoc(Buffer.from(item[1].bytes, 'base64'))[0] };
    } else if (item[0] === 'tuple' || item[0] === 'list') {
        if (item[1].elements.length === 0) {
            return { type: 'null' };
        }
        return { type: 'tuple', items: item[1].elements.map(parseStackEntry) } as TupleItem;
    } else {
        throw Error('Unsupported stack item type: ' + item[0]);
    }
}

function parseStack(list: unknown[]): TupleReader {
    const items = (list as RawStackItem[]) || [];
    let stack: TupleItem[] = [];
    for (let item of items) {
        stack.push(parseStackItem(item as RawStackItem));
    }
    return new TupleReader(stack);
}

function serializeStack(list: TupleItem[]): RawStackItem[] {
    let stack: RawStackItem[] = [];
    for (let item of list) {
        if (item.type === 'int') {
            stack.push(['num', item.value.toString()]);
        } else if (item.type === 'cell') {
            stack.push(['cell', { bytes: item.cell.toBoc().toString('base64') }]);
        } else if (item.type === 'slice') {
            stack.push(['slice', { bytes: item.cell.toBoc().toString('base64') }]);
        } else if (item.type === 'builder') {
            stack.push(['builder', { bytes: item.cell.toBoc().toString('base64') }]);
        } else {
            throw Error('Unsupported stack item type: ' + item.type);
        }
    }
    return stack;
}

function parseRawBlockId(data: TonBlockIdExt): BlockId {
    return {
        workchain: data.workchain,
        shard: BigInt(data.shard),
        seqno: data.seqno,
        rootHash: base64ToBigInt(data.root_hash),
        fileHash: base64ToBigInt(data.file_hash),
    };
}

function parseInternalTransactionId(data: InternalTransactionId): TransactionId | null {
    if (data.hash !== 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=') {
        return {
            lt: base64ToBigInt(data.lt),
            hash: base64ToBigInt(data.hash),
        };
    }
    return null;
}
