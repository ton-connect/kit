/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ExtraCurrency } from '@ton/core';
import { Address } from '@ton/core';

import { Base64ToBigInt, Base64Normalize, Base64ToHex } from '../../utils/base64';
import type { FullAccountState } from '../../types/toncenter/api';
import type { JettonInfo, ToncenterEmulationResponse } from '../../types';
import type {
    ApiClient,
    GetJettonsByOwnerRequest,
    GetJettonsByAddressRequest,
    GetPendingTraceRequest,
    GetPendingTransactionsRequest,
    GetTraceRequest,
    GetTransactionByHashRequest,
    TransactionsByAddressRequest,
    GetEventsResponse,
    GetEventsRequest,
} from '../../types/toncenter/ApiClient';
import type { NftItemsResponseV3 } from '../../types/toncenter/v3/NftItemsResponseV3';
import { toNftItemsResponse } from '../../types/toncenter/v3/NftItemsResponseV3';
import type {
    ToncenterResponseJettonMasters,
    ToncenterResponseJettonWallets,
    ToncenterTracesResponse,
    ToncenterTransactionsResponse,
    EmulationTokenInfoMasters,
} from '../../types/toncenter/emulation';
import { toTransactionsResponse } from '../../types/toncenter/emulation';
import { CallForSuccess } from '../../utils/retry';
import { globalLogger } from '../../core/Logger';
import type { DNSRecordsResponseV3 } from '../../types/toncenter/v3/DNSRecordsResponseV3';
import { toDnsRecords } from '../../types/toncenter/v3/DNSRecordsResponseV3';
import {
    DnsCategory,
    dnsResolve,
    ROOT_DNS_RESOLVER_MAINNET,
    ROOT_DNS_RESOLVER_TESTNET,
} from '../../types/toncenter/dnsResolve';
import { toAddressBook, toEvent } from '../../types/toncenter/AccountEvent';
import { Network } from '../../api/models';
import type {
    Base64String,
    GetMethodResult,
    Jetton,
    JettonsResponse,
    NFTsRequest,
    NFTsResponse,
    RawStackItem,
    TokenAmount,
    TransactionsResponse,
    UserFriendlyAddress,
    UserNFTsRequest,
} from '../../api/models';
import { asAddressFriendly } from '../../utils/address';
import type { ToncenterEmulationResult } from '../../utils/toncenterEmulation';
import { BaseApiClient } from '../BaseApiClient';
import type { BaseApiClientConfig } from '../BaseApiClient';
import type { V2AddressInformation, V2SendMessageResult, V3RunGetMethodRequest } from './types';
import { padBase64, parseInternalTransactionId, prepareAddress } from './utils';

const log = globalLogger.createChild('ApiClientToncenter');

export interface ApiClientConfig extends BaseApiClientConfig {
    dnsResolver?: string;
}

export class ApiClientToncenter extends BaseApiClient implements ApiClient {
    private readonly dnsResolver: string;

    constructor(config: ApiClientConfig = {}) {
        const defaultEndpoint =
            config.network?.chainId === Network.mainnet().chainId
                ? 'https://toncenter.com'
                : 'https://testnet.toncenter.com';

        super(config, defaultEndpoint);

        const dnsResolver =
            this.network?.chainId === Network.mainnet().chainId ? ROOT_DNS_RESOLVER_MAINNET : ROOT_DNS_RESOLVER_TESTNET;

        this.dnsResolver = config.dnsResolver ?? dnsResolver;
    }

    protected appendAuthHeaders(headers: Headers): void {
        if (this.apiKey) headers.set('x-api-key', this.apiKey);
    }

    async nftItemsByAddress(request: NFTsRequest): Promise<NFTsResponse> {
        const props: Record<string, unknown> = {
            address: request.address,
        };
        const response = await this.getJson<NftItemsResponseV3>('/api/v3/nft/items', props);
        return toNftItemsResponse(response);
    }

    async nftItemsByOwner(request: UserNFTsRequest): Promise<NFTsResponse> {
        const props: Record<string, unknown> = {
            owner_address: request.ownerAddress,
            limit: request.pagination?.limit ?? 10,
            offset: request.pagination?.offset ?? 0,
        };
        const response = await this.getJson<NftItemsResponseV3>('/api/v3/nft/items', props);
        const formattedResponse = toNftItemsResponse(response);
        return formattedResponse;
    }

    async fetchEmulation(messageBoc: Base64String, ignoreSignature?: boolean): Promise<ToncenterEmulationResult> {
        const props: Record<string, unknown> = {
            boc: messageBoc,
            ignore_chksig: ignoreSignature === true,
            include_code_data: true,
            include_address_book: true,
            include_metadata: true,
            with_actions: true,
        };
        const response = await this.postJson<ToncenterEmulationResponse>('/api/emulate/v1/emulateTrace', props);
        return {
            result: 'success',
            emulationResult: response,
        };
    }

    async sendBoc(boc: Base64String): Promise<string> {
        if (this.disableNetworkSend) {
            return '';
        }
        const response = await this.postJson<V2SendMessageResult>('/api/v3/message', { boc });
        return Base64ToBigInt(response.message_hash_norm).toString(16);
    }

    async runGetMethod(
        address: UserFriendlyAddress,
        method: string,
        stack: RawStackItem[] = [],
        seqno?: number,
    ): Promise<GetMethodResult> {
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

    async getAccountState(address: UserFriendlyAddress, seqno?: number): Promise<FullAccountState> {
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

    async getBalance(address: UserFriendlyAddress, seqno?: number): Promise<TokenAmount> {
        return (await this.getAccountState(address, seqno)).balance;
    }

    async getAccountTransactions(request: TransactionsByAddressRequest): Promise<TransactionsResponse> {
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
        return toTransactionsResponse(response);
    }

    async getTransactionsByHash(request: GetTransactionByHashRequest): Promise<TransactionsResponse> {
        const msgHash = 'msgHash' in request ? padBase64(request.msgHash) : undefined;
        const bodyHash = 'bodyHash' in request ? padBase64(request.bodyHash) : undefined;

        const response = await this.getJson<ToncenterTransactionsResponse>('/api/v3/transactionsByMessage', {
            msg_hash: msgHash ? [msgHash] : undefined,
            body_hash: bodyHash ? [bodyHash] : undefined,
        });
        return toTransactionsResponse(response);
    }

    async getPendingTransactions(request: GetPendingTransactionsRequest): Promise<TransactionsResponse> {
        const accounts = 'accounts' in request ? request.accounts?.map(prepareAddress) : undefined;
        const traceId = 'traceId' in request ? request.traceId : undefined;
        const response = await this.getJson<ToncenterTransactionsResponse>('/api/v3/pendingTransactions', {
            account: accounts,
            trace_id: traceId,
        });
        return toTransactionsResponse(response);
    }

    async getTrace(request: GetTraceRequest): Promise<ToncenterTracesResponse> {
        const inTraceId = request.traceId ? request.traceId[0] : undefined;

        const traceId = padBase64(Base64Normalize(inTraceId || '').replace(/=/g, ''));

        const tryGetTrace = async (field: 'tx_hash' | 'trace_id' | 'msg_hash') => {
            const response = await CallForSuccess(
                () => this.getJson<ToncenterTracesResponse>('/api/v3/traces', { [field]: traceId }),
                undefined,
                undefined,
                // 422: toncenter failed to decode field value
                (err) => (err instanceof TonClientError ? err.status !== 422 : true),
            );

            if (response?.traces?.length > 0) {
                return response;
            }

            throw new Error(`No traces found for ${field}`);
        };

        const results = await Promise.allSettled([
            tryGetTrace('tx_hash'),
            tryGetTrace('trace_id'),
            tryGetTrace('msg_hash'),
        ]);

        const fulfilledResult = results.find((result) => result.status === 'fulfilled');

        if (fulfilledResult) {
            return fulfilledResult.value;
        }

        results.forEach((result) => {
            if (result.status === 'rejected') {
                log.error('Error fetching trace', { error: result.reason });
            }
        });

        throw new Error('Failed to fetch trace');
    }

    async getPendingTrace(request: GetPendingTraceRequest): Promise<ToncenterTracesResponse> {
        try {
            const response = await CallForSuccess(
                () => {
                    return this.getJson<ToncenterTracesResponse>('/api/v3/pendingTraces', {
                        ext_msg_hash: request.externalMessageHash,
                    });
                },
                undefined,
                undefined,
                // 422: toncenter failed to decode field value
                (err) => (err instanceof TonClientError ? err.status !== 422 : true),
            );

            if (response?.traces?.length > 0) {
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

    async jettonsByOwnerAddress(request: GetJettonsByOwnerRequest): Promise<JettonsResponse> {
        const offset = request.offset ?? 0;
        const limit = request.limit ?? 50;
        const rawResponse = await this.getJson<ToncenterResponseJettonWallets>('/api/v3/jetton/wallets', {
            owner_address: request.ownerAddress,
            offset,
            limit,
        });

        return this.mapToResponseUserJettons(rawResponse);
    }

    private mapToResponseUserJettons(rawResponse: ToncenterResponseJettonWallets): JettonsResponse {
        // Currently we hardcoding USDT jetton as verified
        const verifiedJettonsMasters = new Set<string>([
            '0:B113A994B5024A16719F69139328EB759596C38A25F59028B146FECDC3621DFE',
        ]);

        const userJettons: Jetton[] = rawResponse.jetton_wallets.map((wallet) => {
            const jettonInfo = this.extractJettonInfoFromMetadata(wallet.jetton, rawResponse.metadata);
            const jetton: Jetton = {
                address: asAddressFriendly(wallet.jetton),
                walletAddress: asAddressFriendly(wallet.address),
                balance: wallet.balance,
                info: {
                    name: jettonInfo.name,
                    description: jettonInfo.description,
                    image: {
                        url: jettonInfo.image,
                        data: jettonInfo.image_data,
                    },
                    symbol: jettonInfo.symbol,
                },
                decimalsNumber: jettonInfo.decimals,
                // For future use, currently prices are not provided by toncenter
                prices: [
                    {
                        value: '0',
                        currency: 'USD',
                    },
                ],
                isVerified: verifiedJettonsMasters.has(wallet.jetton),
                // ????
                // extra: rawResponse.metadata[wallet.jetton]?.token_info,
            };
            return jetton;
        });

        return {
            jettons: userJettons,
            addressBook: {},
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
                    : (metadataJettonInfo.extra.decimals as number | undefined);

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

    async getEvents(request: GetEventsRequest): Promise<GetEventsResponse> {
        const account = request.account instanceof Address ? request.account.toString() : request.account;
        const limit = request.limit ?? 20;
        const offset = request.offset ?? 0;
        const query: Record<string, unknown> = {
            account,
            limit,
            offset,
        };
        const list = await this.getJson<ToncenterTracesResponse>('/api/v3/traces', query);
        const out: GetEventsResponse = { events: [], limit, offset, hasNext: list.traces.length >= limit };
        const addressBook = toAddressBook(list);
        for (const trace of list.traces) {
            out.events.push(toEvent(trace, account, addressBook));
        }
        return out;
    }
}
