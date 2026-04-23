/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StateInit } from '@ton/core';
import {
    Address,
    beginCell,
    Cell,
    Dictionary,
    contractAddress,
    loadStateInit,
    SendMode,
    storeMessage,
    storeStateInit,
} from '@ton/core';
import { external, internal } from '@ton/core';
import type {
    ApiClient,
    WalletAdapter,
    WalletSigner,
    Network,
    PreparedSignData,
    ProofMessage,
    TransactionRequest,
    UserFriendlyAddress,
    Hex,
    Base64String,
    Feature,
    WalletId,
} from '@ton/walletkit';
import {
    WalletKitError,
    ERROR_CODES,
    FakeSignature,
    formatWalletAddress,
    CallForSuccess,
    HexToUint8Array,
    CreateTonProofMessageBytes,
    createWalletId,
} from '@ton/walletkit';

import { AgenticWalletCodeCell } from './AgenticWallet.source.js';
import { ActionSendMsg, packActionsList } from '../w5_ownable/actions.js';

export const defaultAgenticWorkchain = 0;

export interface AgenticWalletAdapterConfig {
    signer: WalletSigner;
    publicKey: Hex;
    tonClient: ApiClient;
    network: Network;
    workchain?: number;
    walletAddress?: Address;
    walletNftIndex?: bigint;
    collectionAddress?: Address;
}

function parseHexOrDecBigInt(input: string): bigint {
    const value = input.trim();
    if (value.startsWith('-')) {
        return -BigInt(value.slice(1));
    }
    return BigInt(value);
}

function parseTopStackInt(stack: unknown): bigint {
    if (!Array.isArray(stack) || stack.length === 0) {
        throw new Error('Empty stack');
    }

    const top = stack[0] as { type?: string; value?: string };
    if (top.type !== 'num' || typeof top.value !== 'string') {
        throw new Error(`Unsupported stack top item: ${JSON.stringify(top)}`);
    }

    return parseHexOrDecBigInt(top.value);
}

function buildAgenticInitData(nftItemIndex: bigint, collectionAddress: Address): Cell {
    return beginCell()
        .storeUint(nftItemIndex, 256)
        .storeAddress(collectionAddress)
        .storeBit(true)
        .storeUint(0, 32)
        .storeDict(Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Bool()))
        .storeMaybeRef(null)
        .endCell();
}

function parseAddress(value: string): Address {
    return Address.parse(value);
}

export class AgenticWalletAdapter implements WalletAdapter {
    private signer: WalletSigner;
    private config: AgenticWalletAdapterConfig;

    readonly client: ApiClient;
    public readonly publicKey: Hex;
    public readonly version = 'agentic';
    public readonly address: Address;

    private readonly walletInit?: { code: Cell; data: Cell };
    private walletNftIndexCache?: bigint;

    static async create(
        signer: WalletSigner,
        options: {
            client: ApiClient;
            network: Network;
            workchain?: number;
            walletAddress?: string | Address;
            walletNftIndex?: bigint;
            collectionAddress?: string | Address;
        },
    ): Promise<AgenticWalletAdapter> {
        return new AgenticWalletAdapter({
            signer,
            publicKey: signer.publicKey,
            tonClient: options.client,
            network: options.network,
            workchain: options.workchain,
            walletAddress:
                typeof options.walletAddress === 'string' ? parseAddress(options.walletAddress) : options.walletAddress,
            walletNftIndex: options.walletNftIndex,
            collectionAddress:
                typeof options.collectionAddress === 'string'
                    ? parseAddress(options.collectionAddress)
                    : options.collectionAddress,
        });
    }

    constructor(config: AgenticWalletAdapterConfig) {
        this.config = config;
        this.client = config.tonClient;
        this.signer = config.signer;
        this.publicKey = this.config.publicKey;

        if (config.walletNftIndex !== undefined) {
            this.walletNftIndexCache = config.walletNftIndex;
        }

        const workchain = config.workchain ?? defaultAgenticWorkchain;

        if (config.walletNftIndex !== undefined && config.collectionAddress) {
            const init = {
                code: AgenticWalletCodeCell,
                data: buildAgenticInitData(config.walletNftIndex, config.collectionAddress),
            };
            this.walletInit = init;

            const derivedAddress = contractAddress(workchain, init);
            if (config.walletAddress && !config.walletAddress.equals(derivedAddress)) {
                throw new Error(
                    `AGENTIC_WALLET_ADDRESS does not match AGENTIC_WALLET_NFT_INDEX/AGENTIC_COLLECTION_ADDRESS. expected=${derivedAddress.toString()} provided=${config.walletAddress.toString()}`,
                );
            }
            this.address = config.walletAddress ?? derivedAddress;
            return;
        }

        if (!config.walletAddress) {
            throw new Error(
                'Agentic wallet configuration requires AGENTIC_WALLET_ADDRESS, or AGENTIC_WALLET_NFT_INDEX with AGENTIC_COLLECTION_ADDRESS.',
            );
        }

        this.address = config.walletAddress;
    }

    getPublicKey(): Hex {
        return this.publicKey;
    }

    getClient(): ApiClient {
        return this.client;
    }

    async sign(bytes: Iterable<number>): Promise<Hex> {
        return this.signer.sign(bytes);
    }

    getNetwork(): Network {
        return this.config.network;
    }

    getAddress(options?: { testnet?: boolean }): UserFriendlyAddress {
        return formatWalletAddress(this.address, options?.testnet);
    }

    getWalletId(): WalletId {
        return createWalletId(this.getNetwork(), this.getAddress());
    }

    async getStateInit(): Promise<Base64String> {
        if (!this.walletInit) {
            throw new Error(
                'Agentic wallet init is not configured. Provide AGENTIC_WALLET_NFT_INDEX and AGENTIC_COLLECTION_ADDRESS to enable state init.',
            );
        }

        const stateInit = beginCell()
            .store(storeStateInit(this.walletInit as unknown as StateInit))
            .endCell();
        return stateInit.toBoc().toString('base64') as Base64String;
    }

    async getSignedSendTransaction(
        input: TransactionRequest,
        options: { fakeSignature: boolean },
    ): Promise<Base64String> {
        const actions = packActionsList(
            input.messages.map((m) => {
                let bounce = true;
                const parsedAddress = Address.parseFriendly(m.address);
                if (parsedAddress.isBounceable === false) {
                    bounce = false;
                }

                const msg = internal({
                    to: m.address,
                    value: BigInt(m.amount),
                    bounce,
                    extracurrency: m.extraCurrency
                        ? Object.fromEntries(Object.entries(m.extraCurrency).map(([k, v]) => [Number(k), BigInt(v)]))
                        : undefined,
                });

                if (m.payload) {
                    try {
                        msg.body = Cell.fromBase64(m.payload);
                    } catch (error) {
                        throw WalletKitError.fromError(
                            ERROR_CODES.CONTRACT_VALIDATION_FAILED,
                            'Failed to parse transaction payload',
                            error,
                        );
                    }
                }

                if (m.stateInit) {
                    try {
                        msg.init = loadStateInit(Cell.fromBase64(m.stateInit).asSlice());
                    } catch (error) {
                        throw WalletKitError.fromError(
                            ERROR_CODES.CONTRACT_VALIDATION_FAILED,
                            'Failed to parse state init',
                            error,
                        );
                    }
                }

                return new ActionSendMsg(SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS, msg);
            }),
        );

        const createBodyOptions: { validUntil: number | undefined; fakeSignature: boolean } = {
            ...options,
            validUntil: undefined,
        };

        if (input.validUntil) {
            const now = Math.floor(Date.now() / 1000);
            const maxValidUntil = now + 600;
            if (input.validUntil < now) {
                throw new WalletKitError(
                    ERROR_CODES.VALIDATION_ERROR,
                    'Transaction validUntil timestamp is in the past',
                    undefined,
                    { validUntil: input.validUntil, currentTime: now },
                );
            }

            createBodyOptions.validUntil = input.validUntil > maxValidUntil ? maxValidUntil : input.validUntil;
        }

        let seqno = 0;
        try {
            seqno = await CallForSuccess(async () => this.getSeqno(), 5, 1000);
        } catch (_) {
            // allow seqno fallback to 0 for undeployed contracts
        }

        const walletNftIndex = await this.getWalletNftIndex();
        const outActions = this.extractOutActions(actions);
        const transfer = await this.createSignedBody(seqno, walletNftIndex, outActions, createBodyOptions);

        const ext = external({
            to: this.address,
            init: this.walletInit,
            body: transfer,
        });

        return beginCell().store(storeMessage(ext)).endCell().toBoc().toString('base64') as Base64String;
    }

    async getSeqno(): Promise<number> {
        const data = await this.client.runGetMethod(this.getAddress(), 'seqno');
        if (data.exitCode !== 0) {
            throw new Error(`seqno get-method failed with exit code ${data.exitCode}`);
        }

        return Number(parseTopStackInt(data.stack));
    }

    async getWalletNftIndex(): Promise<bigint> {
        if (this.walletNftIndexCache !== undefined) {
            return this.walletNftIndexCache;
        }

        const data = await this.client.runGetMethod(this.getAddress(), 'get_subwallet_id');
        if (data.exitCode !== 0) {
            throw new Error(`get_subwallet_id failed with exit code ${data.exitCode}`);
        }

        const nftIndex = parseTopStackInt(data.stack);
        this.walletNftIndexCache = nftIndex;
        return nftIndex;
    }

    private extractOutActions(actionsList: Cell): Cell | null {
        const slice = actionsList.beginParse();
        return slice.loadMaybeRef();
    }

    async createSignedBody(
        seqno: number,
        walletNftIndex: bigint,
        outActions: Cell | null,
        options: { validUntil: number | undefined; fakeSignature: boolean },
    ): Promise<Cell> {
        const authSigned = 0x7369676e;
        const expireAt = options.validUntil ?? Math.floor(Date.now() / 1000) + 300;

        const payload = beginCell()
            .storeUint(authSigned, 32)
            .storeUint(walletNftIndex, 256)
            .storeUint(expireAt, 32)
            .storeUint(seqno, 32)
            .storeMaybeRef(outActions)
            .storeMaybeRef(null)
            .endCell();

        const signingData = payload.hash();
        const signature = options.fakeSignature ? FakeSignature(signingData) : await this.sign(signingData);

        return beginCell()
            .storeSlice(payload.beginParse())
            .storeBuffer(Buffer.from(HexToUint8Array(signature)))
            .endCell();
    }

    async getSignedSignData(input: PreparedSignData): Promise<Hex> {
        return this.sign(HexToUint8Array(input.hash));
    }

    async getSignedTonProof(input: ProofMessage): Promise<Hex> {
        const message = await CreateTonProofMessageBytes(input);
        return this.sign(message);
    }

    getSupportedFeatures(): Feature[] | undefined {
        return [
            {
                name: 'SendTransaction',
                maxMessages: 255,
            },
            {
                name: 'SignData',
                types: ['binary', 'cell', 'text'],
            },
        ];
    }
}
