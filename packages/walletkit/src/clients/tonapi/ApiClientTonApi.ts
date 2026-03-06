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
    Hex,
    Transaction,
    TransactionDescription,
    TransactionMessage,
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
import type { EmulationTraceNode, ToncenterResponseJettonMasters, ToncenterTracesResponse } from '../../types/toncenter/emulation';
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
import { Base64Normalize, Base64ToBigInt, Base64ToHex, getNormalizedExtMessageHash, isHex } from '../../utils';
import { toAccount } from '../../types/toncenter/AccountEvent';

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

    async jettonsByAddress(request: GetJettonsByAddressRequest): Promise<ToncenterResponseJettonMasters> {
        const raw = await this.getJson<TonApiJettonInfo>(`/v2/jettons/${request.address}`);

        return mapJettonMasters(raw);
    }

    async jettonsByOwnerAddress(request: GetJettonsByOwnerRequest): Promise<JettonsResponse> {
        const raw = await this.getJson<TonApiJettonsBalances>(
            `/v2/accounts/${request.ownerAddress}/jettons?currencies=usd`,
        );

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
        const address = _request.address?.[0];
        if (!address) {
            return { transactions: [], addressBook: {} };
        }

        const limit = Math.max(1, Math.min(_request.limit ?? 10, 100));
        const offset = Math.max(0, _request.offset ?? 0);

        const response = await this.getJson<TonApiTransactionsResponse>(`/v2/blockchain/accounts/${address}/transactions`, {
            limit,
            offset,
            sort_order: 'desc',
        });

        const transactions = (response.transactions ?? []).map((tx) => this.mapTonApiTransaction(tx));

        return {
            transactions,
            addressBook: {},
        };
    }

    async getTransactionsByHash(_request: GetTransactionByHashRequest): Promise<TransactionsResponse> {
        const isMessageHash = 'msgHash' in _request;
        const requestHash = isMessageHash ? _request.msgHash : _request.bodyHash;
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
            transactions: [this.mapTonApiTransaction(tx)],
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

    async getTrace(_request: GetTraceRequest): Promise<ToncenterTracesResponse> {
        const candidates = _request.traceId && _request.traceId.length > 0 ? _request.traceId : [];
        if (_request.account) {
            candidates.push(String(_request.account));
        }

        for (const candidate of candidates) {
            const traceId = this.normalizeTonApiId(candidate);
            try {
                const trace = await this.getJson<TonApiTrace>(`/v2/traces/${traceId}`);
                return this.mapTonApiTrace(trace);
            } catch (error) {
                if (error instanceof TonClientError && error.status === 404) {
                    continue;
                }
                throw error;
            }
        }

        throw new Error('Failed to fetch trace');
    }

    async getPendingTrace(_request: GetPendingTraceRequest): Promise<ToncenterTracesResponse> {
        for (const messageHash of _request.externalMessageHash) {
            const normalizedHash = this.normalizeTonApiId(messageHash);
            try {
                const tx = await this.getJson<TonApiTransaction>(`/v2/blockchain/messages/${normalizedHash}/transaction`);
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

    async getEvents(_request: GetEventsRequest): Promise<GetEventsResponse> {
        const account = String(_request.account);
        const limit = Math.max(1, Math.min(_request.limit ?? 20, 100));
        const offset = Math.max(0, _request.offset ?? 0);

        const response = await this.getJson<TonApiAccountEventsResponse>(`/v2/accounts/${account}/events`, {
            limit,
            offset,
            sort_order: 'desc',
            i18n: 'en',
        });

        const pageEvents = response.events ?? [];

        return {
            events: pageEvents.map((event) => this.mapTonApiEvent(event)),
            offset,
            limit,
            hasNext: Number(response.next_from ?? 0) > 0 || pageEvents.length >= limit,
        };
    }

    protected appendAuthHeaders(headers: Headers): void {
        headers.set('Accept-Language', 'en');
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

    private mapTonApiTransaction(raw: TonApiTransaction): Transaction {
        const blockRef = parseBlockRef(raw.block);

        return {
            account: asAddressFriendly(raw.account),
            hash: toHex(raw.hash),
            logicalTime: String(raw.lt),
            now: Number(raw.utime ?? 0),
            mcBlockSeqno: blockRef.seqno,
            traceExternalHash: toHex(raw.hash),
            previousTransactionHash: raw.prev_trans_hash || undefined,
            previousTransactionLogicalTime:
                raw.prev_trans_lt !== undefined && raw.prev_trans_lt !== null ? String(raw.prev_trans_lt) : undefined,
            origStatus: toAccountStatus(raw.orig_status),
            endStatus: toAccountStatus(raw.end_status),
            totalFees: String(raw.total_fees ?? 0),
            totalFeesExtraCurrencies: {},
            blockRef,
            inMessage: raw.in_msg ? this.mapTonApiMessage(raw.in_msg) : undefined,
            outMessages: (raw.out_msgs ?? []).map((message) => this.mapTonApiMessage(message)),
            description: this.mapTonApiDescription(raw),
            isEmulated: false,
        };
    }

    private mapTonApiMessage(raw: TonApiMessage): TransactionMessage {
        const extra: Record<number, string> = {};
        for (const currency of raw.value_extra ?? []) {
            extra[Number(currency.id)] = String(currency.amount ?? 0);
        }

        return {
            hash: toHex(raw.hash),
            source: raw.source ? asAddressFriendly(raw.source) : undefined,
            destination: raw.destination ? asAddressFriendly(raw.destination) : undefined,
            value: raw.value !== undefined && raw.value !== null ? String(raw.value) : undefined,
            valueExtraCurrencies: extra,
            fwdFee: raw.fwd_fee !== undefined && raw.fwd_fee !== null ? String(raw.fwd_fee) : undefined,
            ihrFee: raw.ihr_fee !== undefined && raw.ihr_fee !== null ? String(raw.ihr_fee) : undefined,
            creationLogicalTime:
                raw.created_lt !== undefined && raw.created_lt !== null ? String(raw.created_lt) : undefined,
            createdAt: raw.created_at ? Number(raw.created_at) : undefined,
            opcode: raw.op_code ?? undefined,
            ihrDisabled: raw.ihr_disabled ?? undefined,
            isBounce: raw.bounce ?? undefined,
            isBounced: raw.bounced ?? undefined,
            importFee: raw.import_fee !== undefined && raw.import_fee !== null ? String(raw.import_fee) : undefined,
            messageContent: {
                body: undefined,
                decoded: raw.decoded_body,
            },
        };
    }

    private mapTonApiDescription(raw: TonApiTransaction): TransactionDescription {
        return {
            type: raw.transaction_type ?? 'ord',
            isAborted: raw.aborted ?? !(raw.success ?? true),
            isDestroyed: raw.destroyed ?? false,
            isCreditFirst: false,
            isTock: false,
            isInstalled: false,
            storagePhase: {
                storageFeesCollected: String(raw.storage_phase?.storage_fees_collected ?? 0),
                statusChange: raw.storage_phase?.status_change ?? 'unchanged',
            },
            creditPhase:
                raw.credit_phase?.credit !== undefined && raw.credit_phase?.credit !== null
                    ? {
                          credit: String(raw.credit_phase.credit),
                      }
                    : undefined,
            computePhase: {
                isSkipped: raw.compute_phase?.skipped ?? false,
                isSuccess: raw.compute_phase?.success ?? (raw.success ?? true),
                isMessageStateUsed: false,
                isAccountActivated: false,
                gasFees: String(raw.compute_phase?.gas_fees ?? 0),
                gasUsed: String(raw.compute_phase?.gas_used ?? 0),
                gasLimit: String(raw.compute_phase?.gas_used ?? 0),
                mode: 0,
                exitCode: raw.compute_phase?.exit_code ?? (raw.success ? 0 : 1),
                vmStepsNumber: raw.compute_phase?.vm_steps ?? 0,
            },
            action: {
                isSuccess: raw.action_phase?.success ?? (raw.success ?? true),
                isValid: true,
                hasNoFunds: false,
                statusChange: 'unchanged',
                totalForwardingFees: String(raw.action_phase?.fwd_fees ?? 0),
                totalActionFees: String(raw.action_phase?.total_fees ?? 0),
                resultCode: raw.action_phase?.result_code ?? 0,
                totalActionsNumber: raw.action_phase?.total_actions ?? 0,
                specActionsNumber: 0,
                skippedActionsNumber: raw.action_phase?.skipped_actions ?? 0,
                messagesCreatedNumber: raw.out_msgs?.length ?? 0,
                totalMessagesSize: {
                    cells: '0',
                    bits: '0',
                },
            },
        };
    }

    private mapTonApiTrace(trace: TonApiTrace): ToncenterTracesResponse {
        const traceTransactions = flattenTrace(trace);
        const transactions = Object.fromEntries(
            traceTransactions.map((tx) => [tx.hash, this.mapTonApiTraceTransaction(tx)]),
        );
        const transactionsOrder = [...traceTransactions]
            .sort((a, b) => BigInt(a.lt ?? 0) < BigInt(b.lt ?? 0) ? -1 : 1)
            .map((tx) => tx.hash);

        const lts = traceTransactions.map((tx) => BigInt(tx.lt ?? 0));
        const times = traceTransactions.map((tx) => Number(tx.utime ?? 0));

        const startLt = lts.length > 0 ? lts.reduce((min, value) => (value < min ? value : min), lts[0]) : 0n;
        const endLt = lts.length > 0 ? lts.reduce((max, value) => (value > max ? value : max), lts[0]) : 0n;
        const startUtime = times.length > 0 ? Math.min(...times) : 0;
        const endUtime = times.length > 0 ? Math.max(...times) : 0;

        const traceId = trace.transaction.hash;
        const rootTx = this.mapTonApiTraceTransaction(trace.transaction);
        const messagesCount = traceTransactions.reduce(
            (acc, tx) => acc + (tx.in_msg ? 1 : 0) + (tx.out_msgs?.length ?? 0),
            0,
        );

        return {
            address_book: {},
            metadata: {},
            traces: [
                {
                    actions: [],
                    end_lt: endLt.toString(),
                    end_utime: endUtime,
                    external_hash: rootTx.in_msg?.hash ?? '',
                    is_incomplete: false,
                    mc_seqno_end: String(rootTx.mc_block_seqno ?? 0),
                    mc_seqno_start: String(rootTx.mc_block_seqno ?? 0),
                    start_lt: startLt.toString(),
                    start_utime: startUtime,
                    trace: this.mapTonApiTraceNode(trace),
                    trace_id: traceId,
                    trace_info: {
                        classification_state: 'tonapi',
                        messages: messagesCount,
                        pending_messages: 0,
                        trace_state: 'complete',
                        transactions: traceTransactions.length,
                    },
                    transactions,
                    transactions_order: transactionsOrder,
                    warning: '',
                },
            ],
        };
    }

    private mapTonApiTraceNode(trace: TonApiTrace): EmulationTraceNode {
        return {
            tx_hash: trace.transaction.hash,
            in_msg_hash: trace.transaction.in_msg?.hash ?? null,
            children: (trace.children ?? []).map((child) => this.mapTonApiTraceNode(child)),
        };
    }

    private mapTonApiTraceTransaction(raw: TonApiTransaction) {
        const blockRef = parseBlockRef(raw.block);
        const inMsg = raw.in_msg ? this.mapTonApiTraceMessage(raw.in_msg) : null;
        const outMsgs = (raw.out_msgs ?? []).map((message) => this.mapTonApiTraceMessage(message));

        return {
            account: raw.account,
            hash: raw.hash,
            lt: String(raw.lt ?? 0),
            now: Number(raw.utime ?? 0),
            mc_block_seqno: blockRef.seqno,
            trace_external_hash: raw.hash,
            prev_trans_hash: raw.prev_trans_hash ?? null,
            prev_trans_lt:
                raw.prev_trans_lt !== undefined && raw.prev_trans_lt !== null ? String(raw.prev_trans_lt) : null,
            orig_status: mapTraceStatus(raw.orig_status),
            end_status: mapTraceStatus(raw.end_status),
            total_fees: String(raw.total_fees ?? 0),
            total_fees_extra_currencies: {},
            description: {
                type: raw.transaction_type ?? 'ord',
                aborted: raw.aborted ?? !(raw.success ?? true),
                destroyed: raw.destroyed ?? false,
                credit_first: false,
                is_tock: false,
                installed: false,
                storage_ph: {
                    storage_fees_collected: String(raw.storage_phase?.storage_fees_collected ?? 0),
                    status_change: raw.storage_phase?.status_change ?? 'unchanged',
                },
                credit_ph:
                    raw.credit_phase?.credit !== undefined && raw.credit_phase?.credit !== null
                        ? { credit: String(raw.credit_phase.credit) }
                        : undefined,
                compute_ph: {
                    skipped: raw.compute_phase?.skipped ?? false,
                    success: raw.compute_phase?.success ?? (raw.success ?? true),
                    msg_state_used: false,
                    account_activated: false,
                    gas_fees: String(raw.compute_phase?.gas_fees ?? 0),
                    gas_used: String(raw.compute_phase?.gas_used ?? 0),
                    gas_limit: String(raw.compute_phase?.gas_used ?? 0),
                    mode: 0,
                    exit_code: raw.compute_phase?.exit_code ?? (raw.success ? 0 : 1),
                    vm_steps: raw.compute_phase?.vm_steps ?? 0,
                    vm_init_state_hash: '',
                    vm_final_state_hash: '',
                },
                action: {
                    success: raw.action_phase?.success ?? (raw.success ?? true),
                    valid: true,
                    no_funds: false,
                    status_change: 'unchanged',
                    total_fwd_fees: String(raw.action_phase?.fwd_fees ?? 0),
                    total_action_fees: String(raw.action_phase?.total_fees ?? 0),
                    result_code: raw.action_phase?.result_code ?? 0,
                    tot_actions: raw.action_phase?.total_actions ?? 0,
                    spec_actions: 0,
                    skipped_actions: raw.action_phase?.skipped_actions ?? 0,
                    msgs_created: raw.out_msgs?.length ?? 0,
                    action_list_hash: '',
                    tot_msg_size: {
                        cells: '0',
                        bits: '0',
                    },
                },
            },
            block_ref: {
                workchain: blockRef.workchain,
                shard: blockRef.shard,
                seqno: blockRef.seqno,
            },
            in_msg: inMsg,
            out_msgs: outMsgs,
            account_state_before: {
                hash: '',
                balance: String(raw.end_balance ?? 0),
                extra_currencies: null,
                account_status: mapTraceStatus(raw.orig_status),
                frozen_hash: null,
                data_hash: null,
                code_hash: null,
            },
            account_state_after: {
                hash: '',
                balance: String(raw.end_balance ?? 0),
                extra_currencies: null,
                account_status: mapTraceStatus(raw.end_status),
                frozen_hash: null,
                data_hash: null,
                code_hash: null,
            },
            emulated: false,
            trace_id: raw.hash,
        };
    }

    private mapTonApiTraceMessage(raw: TonApiMessage) {
        const extraCurrencies: Record<string, string> = {};
        for (const currency of raw.value_extra ?? []) {
            extraCurrencies[String(currency.id)] = String(currency.amount ?? 0);
        }

        return {
            hash: raw.hash ?? '',
            source: raw.source ?? null,
            destination: raw.destination ?? '',
            value: raw.value !== undefined && raw.value !== null ? String(raw.value) : null,
            value_extra_currencies: extraCurrencies,
            fwd_fee: raw.fwd_fee !== undefined && raw.fwd_fee !== null ? String(raw.fwd_fee) : null,
            ihr_fee: raw.ihr_fee !== undefined && raw.ihr_fee !== null ? String(raw.ihr_fee) : null,
            created_lt:
                raw.created_lt !== undefined && raw.created_lt !== null ? String(raw.created_lt) : null,
            created_at:
                raw.created_at !== undefined && raw.created_at !== null ? String(raw.created_at) : null,
            opcode: raw.op_code ?? null,
            ihr_disabled: raw.ihr_disabled ?? null,
            bounce: raw.bounce ?? null,
            bounced: raw.bounced ?? null,
            import_fee: raw.import_fee !== undefined && raw.import_fee !== null ? String(raw.import_fee) : null,
            message_content: {
                hash: '',
                body: '',
                decoded: raw.decoded_body ?? null,
            },
            init_state: null,
            hash_norm: undefined,
        };
    }

    private mapTonApiEvent(raw: TonApiAccountEvent) {
        return {
            eventId: toHex(raw.event_id),
            account: toAccount(raw.account, {}),
            timestamp: Number(raw.timestamp ?? 0),
            actions: (raw.actions ?? []).map((action) => {
                const status: 'success' | 'failure' = action.status === 'failed' ? 'failure' : 'success';
                const actionType = action.type ?? 'Unknown';
                const payload = actionType ? action[actionType] : undefined;
                const actionIdSource = action.base_transactions?.[0] ?? raw.event_id;
                return {
                    type: actionType,
                    id: toHex(actionIdSource),
                    status,
                    simplePreview: {
                        name: action.simple_preview?.name ?? actionType ?? 'Action',
                        description: action.simple_preview?.description ?? action.simple_preview?.name ?? 'Action',
                        value: action.simple_preview?.value ?? '',
                        accounts: (action.simple_preview?.accounts ?? []).map((account) =>
                            toAccount(normalizeTonApiAccountAddress(account), {}),
                        ),
                        valueImage: action.simple_preview?.value_image,
                    },
                    baseTransactions: (action.base_transactions ?? []).map((transactionHash) =>
                        toHex(String(transactionHash)),
                    ),
                    ...(payload && typeof payload === 'object' ? { [actionType]: payload } : {}),
                };
            }),
            isScam: raw.is_scam ?? false,
            lt: Number(raw.lt ?? 0),
            inProgress: raw.in_progress ?? false,
            trace: {
                tx_hash: '',
                in_msg_hash: null,
                children: [],
            },
            transactions: {},
        };
    }
}

interface TonApiTransactionsResponse {
    transactions: TonApiTransaction[];
}

interface TonApiExtraCurrency {
    id: number | string;
    amount: string | number;
}

interface TonApiMessage {
    hash: string;
    source?: string;
    destination?: string;
    value?: string | number | null;
    value_extra?: TonApiExtraCurrency[];
    fwd_fee?: string | number | null;
    ihr_fee?: string | number | null;
    created_lt?: string | number | null;
    created_at?: string | number | null;
    op_code?: string | null;
    ihr_disabled?: boolean | null;
    bounce?: boolean | null;
    bounced?: boolean | null;
    import_fee?: string | number | null;
    decoded_body?: unknown;
}

interface TonApiPhaseStorage {
    storage_fees_collected?: string | number;
    status_change?: string;
}

interface TonApiPhaseCredit {
    credit?: string | number;
}

interface TonApiPhaseCompute {
    skipped?: boolean;
    success?: boolean;
    gas_fees?: string | number;
    gas_used?: string | number;
    exit_code?: number;
    vm_steps?: number;
}

interface TonApiPhaseAction {
    success?: boolean;
    fwd_fees?: string | number;
    total_fees?: string | number;
    result_code?: number;
    total_actions?: number;
    skipped_actions?: number;
}

interface TonApiTransaction {
    hash: string;
    lt: string | number;
    account: string;
    end_balance?: string | number;
    success?: boolean;
    utime?: number;
    orig_status?: string;
    end_status?: string;
    total_fees?: string | number;
    transaction_type?: string;
    state_update_old?: string;
    state_update_new?: string;
    out_msgs?: TonApiMessage[];
    in_msg?: TonApiMessage;
    prev_trans_hash?: string | null;
    prev_trans_lt?: string | number | null;
    block?: string;
    aborted?: boolean;
    destroyed?: boolean;
    raw?: string;
    storage_phase?: TonApiPhaseStorage;
    credit_phase?: TonApiPhaseCredit;
    compute_phase?: TonApiPhaseCompute;
    action_phase?: TonApiPhaseAction;
}

interface TonApiTrace {
    transaction: TonApiTransaction;
    children?: TonApiTrace[];
}

interface TonApiActionSimplePreview {
    name?: string;
    description?: string;
    value?: string;
    value_image?: string;
    accounts?: TonApiAccountRef[];
}

interface TonApiAction {
    type?: string;
    status?: 'ok' | 'failed';
    simple_preview?: TonApiActionSimplePreview;
    base_transactions?: string[];
    [key: string]: unknown;
}

interface TonApiAccountEvent {
    event_id: string;
    timestamp: number;
    actions: TonApiAction[];
    account: string;
    is_scam?: boolean;
    lt?: string | number;
    in_progress?: boolean;
}

interface TonApiAccountEventsResponse {
    events: TonApiAccountEvent[];
    next_from?: number;
}

type TonApiAccountRef = string | { address: string };

function flattenTrace(trace: TonApiTrace): TonApiTransaction[] {
    const out: TonApiTransaction[] = [trace.transaction];
    for (const child of trace.children ?? []) {
        out.push(...flattenTrace(child));
    }
    return out;
}

function parseBlockRef(block: string | undefined): { workchain: number; shard: string; seqno: number } {
    if (!block) {
        return { workchain: 0, shard: '', seqno: 0 };
    }

    const matches = block.match(/\(\s*(-?\d+)\s*,\s*([^,]+)\s*,\s*(-?\d+)\s*\)/);
    if (!matches) {
        return { workchain: 0, shard: block, seqno: 0 };
    }

    const workchain = Number(matches[1]);
    const seqno = Number(matches[3]);

    return {
        workchain: Number.isFinite(workchain) ? workchain : 0,
        shard: matches[2].trim(),
        seqno: Number.isFinite(seqno) ? seqno : 0,
    };
}

function toAccountStatus(
    status: string | undefined,
): { type: 'active' } | { type: 'frozen' } | { type: 'uninit' } | { type: 'unknown'; value: string } | undefined {
    if (!status) return undefined;
    if (status === 'active') return { type: 'active' };
    if (status === 'frozen') return { type: 'frozen' };
    if (status === 'uninit') return { type: 'uninit' };
    if (status === 'nonexist') return { type: 'unknown', value: 'nonexist' };
    return { type: 'unknown', value: status };
}

function mapTraceStatus(status: string | undefined): 'active' | 'frozen' | 'uninit' | string {
    if (!status || status === 'nonexist') {
        return 'uninit';
    }
    if (status === 'active' || status === 'frozen' || status === 'uninit') {
        return status;
    }
    return status;
}

function toHex(value: string): Hex {
    const normalized = value.trim();
    if (!normalized) {
        throw new Error('Invalid hex value: empty input');
    }

    if (isHex(normalized)) {
        return normalized.toLowerCase() as Hex;
    }

    if (/^[0-9a-fA-F]+$/.test(normalized) && normalized.length % 2 === 0) {
        return `0x${normalized.toLowerCase()}` as Hex;
    }

    try {
        return Base64ToHex(Base64Normalize(normalized)).toLowerCase() as Hex;
    } catch {
        // fallthrough
    }

    throw new Error(`Invalid hex value: ${value}`);
}

function normalizeTonApiAccountAddress(account: TonApiAccountRef): string {
    if (typeof account === 'string') {
        return account;
    }
    return account?.address ?? '';
}
