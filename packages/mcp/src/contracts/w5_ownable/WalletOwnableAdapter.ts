/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// WalletOwnable adapter that implements WalletInterface
// This adapter is used when MCP controls a user's wallet address with its own keypair

import type { StateInit } from '@ton/core';
import { Address, beginCell, Cell, Dictionary, loadStateInit, SendMode, storeMessage, storeStateInit } from '@ton/core';
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
    HexToBigInt,
    HexToUint8Array,
    CreateTonProofMessageBytes,
    createWalletId,
} from '@ton/walletkit';

import { WalletOwnable, WalletOwnableId } from './WalletOwnable.js';
import { WalletOwnableCodeCell } from './WalletOwnable.source.js';
import { ActionSendMsg, packActionsList } from './actions.js';

export const defaultWalletOwnableId = 2147483409;

/**
 * Configuration for creating a WalletOwnable adapter
 */
export interface WalletOwnableAdapterConfig {
    /** Signer function */
    signer: WalletSigner;
    /** Public key */
    publicKey: Hex;
    /** Wallet ID configuration */
    walletId?: number | bigint;
    /** Shared TON client instance */
    tonClient: ApiClient;
    /** Network */
    network: Network;
    /** Workchain */
    workchain?: number;
    /** NFT owner address */
    owner: Address;
    /** NFT info (itemIndex + collectionAddress) */
    nftInfo: {
        itemIndex: bigint;
        collectionAddress: Address;
    };
}

/**
 * WalletOwnable adapter that implements WalletInterface
 * Used when MCP controls a user's wallet with its own keypair
 */
export class WalletOwnableAdapter implements WalletAdapter {
    private signer: WalletSigner;
    private config: WalletOwnableAdapterConfig;

    readonly walletContract: WalletOwnable;
    readonly client: ApiClient;
    public readonly publicKey: Hex;
    public readonly version = 'w5_ownable';

    private walletId: bigint | undefined;

    /**
     * Static factory method to create a WalletOwnableAdapter
     * @param signer - Signer function with publicKey property (from Signer utility)
     * @param options - Configuration options for the wallet
     */
    static async create(
        signer: WalletSigner,
        options: {
            client: ApiClient;
            network: Network;
            walletId?: number | bigint;
            workchain?: number;
            owner: Address;
            nftInfo: {
                itemIndex: bigint;
                collectionAddress: Address;
            };
        },
    ): Promise<WalletOwnableAdapter> {
        return new WalletOwnableAdapter({
            signer,
            publicKey: signer.publicKey,
            tonClient: options.client,
            network: options.network,
            walletId: options.walletId,
            workchain: options.workchain,
            owner: options.owner,
            nftInfo: options.nftInfo,
        });
    }

    constructor(config: WalletOwnableAdapterConfig) {
        this.config = config;
        this.client = config.tonClient;
        this.signer = config.signer;

        this.publicKey = this.config.publicKey;
        const walletId =
            typeof config.walletId === 'bigint' ? Number(config.walletId) : (config.walletId ?? defaultWalletOwnableId);
        this.walletId = BigInt(walletId);

        const initCell = this.createItemInitAtDeployment();

        this.config.nftInfo = {
            itemIndex: BigInt('0x' + initCell.hash().toString('hex')),
            collectionAddress: config.nftInfo.collectionAddress,
        };

        this.walletContract = WalletOwnable.createFromConfig(
            {
                publicKey: HexToBigInt(this.publicKey),
                seqno: 0,
                signatureAllowed: true,
                walletId: walletId,

                extensions: Dictionary.empty(),
                owner: config.owner,
                nftInfo: this.config.nftInfo,
            },
            {
                code: WalletOwnableCodeCell,
                workchain: config.workchain ?? 0,
                client: this.client,
            },
        );
    }

    getPublicKey(): Promise<Hex> {
        return Promise.resolve(this.publicKey);
    }

    getClient(): Promise<ApiClient> {
        return Promise.resolve(this.client);
    }

    /**
     * Sign raw bytes with wallet's private key
     */
    async sign(bytes: Iterable<number>): Promise<Hex> {
        return this.signer.sign(bytes);
    }

    getNetwork(): Promise<Network> {
        return Promise.resolve(this.config.network);
    }

    /**
     * Get wallet's TON address
     */
    getAddress(options?: { testnet?: boolean }): Promise<UserFriendlyAddress> {
        return Promise.resolve(formatWalletAddress(this.walletContract.address, options?.testnet));
    }

    async getWalletId(): Promise<WalletId> {
        return createWalletId(await this.getNetwork(), await this.getAddress());
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
                    bounce: bounce,
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
        // add valid untill
        if (input.validUntil) {
            const now = Math.floor(Date.now() / 1000);
            const maxValidUntil = now + 600;
            if (input.validUntil < now) {
                throw new WalletKitError(
                    ERROR_CODES.VALIDATION_ERROR,
                    'Transaction valid_until timestamp is in the past',
                    undefined,
                    { validUntil: input.validUntil, currentTime: now },
                );
            } else if (input.validUntil > maxValidUntil) {
                createBodyOptions.validUntil = maxValidUntil;
            } else {
                createBodyOptions.validUntil = input.validUntil;
            }
        }

        let seqno = 0;
        try {
            seqno = await CallForSuccess(async () => this.getSeqno(), 5, 1000);
        } catch (_) {
            //
        }
        const walletId = (await this.walletContract.walletId).serialized;
        if (!walletId) {
            throw new Error('Failed to get seqno or walletId');
        }

        const transfer = await this.createBody(seqno, walletId, actions, createBodyOptions);

        const ext = external({
            to: this.walletContract.address,
            init: this.walletContract.init,
            body: transfer,
        });

        return beginCell().store(storeMessage(ext)).endCell().toBoc().toString('base64') as Base64String;
    }

    /**
     * Get state init for wallet deployment
     */
    async getStateInit(): Promise<Base64String> {
        if (!this.walletContract.init) {
            throw new Error('Wallet contract not properly initialized');
        }

        const stateInit = beginCell()
            .store(storeStateInit(this.walletContract.init as unknown as StateInit))
            .endCell();
        return stateInit.toBoc().toString('base64') as Base64String;
    }

    /**
     * Get the underlying WalletOwnable contract
     */
    getContract(): WalletOwnable {
        return this.walletContract;
    }

    /**
     * Get current sequence number
     */
    async getSeqno(): Promise<number> {
        return await this.walletContract.seqno;
    }

    /**
     * Get wallet ID
     */
    async getWalletOwnableId(): Promise<WalletOwnableId> {
        try {
            return this.walletContract.walletId;
        } catch (_error) {
            const walletId = this.config.walletId;
            const subwalletNumber = typeof walletId === 'bigint' ? Number(walletId) : walletId || 0;
            return new WalletOwnableId({ subwalletNumber });
        }
    }

    /**
     * Check if wallet is deployed on the network
     */
    async isDeployed(): Promise<boolean> {
        try {
            const state = await this.client.getAccountState(formatWalletAddress(this.walletContract.address));
            return state.status === 'active';
        } catch (_error) {
            return false;
        }
    }

    createItemInitAtDeployment(): Cell {
        // const walletId = this.walletContract.walletId;
        return beginCell()
            .storeUint(1, 1)
            .storeUint(Number(this.walletId), 32)
            .storeUint(HexToBigInt(this.publicKey), 256)
            .storeBit(0) // dict
            .storeAddress(this.config.owner)
            .endCell();
    }

    async createBody(
        seqno: number,
        walletId: bigint,
        actionsList: Cell,
        options: { validUntil: number | undefined; fakeSignature: boolean },
    ) {
        const Opcodes = {
            auth_signed: 0x7369676e,
        };

        const expireAt = options.validUntil ?? Math.floor(Date.now() / 1000) + 300;
        const payload = beginCell()
            .storeUint(Opcodes.auth_signed, 32)
            .storeUint(walletId, 32)
            .storeUint(expireAt, 32)
            .storeUint(seqno, 32) // seqno
            .storeMaybeRef(this.createItemInitAtDeployment())
            .storeSlice(actionsList.beginParse())
            .endCell();

        const signingData = payload.hash();
        const signature = options.fakeSignature ? FakeSignature(signingData) : await this.sign(signingData);
        return beginCell()
            .storeSlice(payload.beginParse())
            .storeBuffer(Buffer.from(HexToUint8Array(signature)))
            .endCell();
    }

    async getSignedSignData(input: PreparedSignData): Promise<Hex> {
        const signature = await this.sign(HexToUint8Array(input.hash));
        return signature;
    }

    async getSignedTonProof(input: ProofMessage): Promise<Hex> {
        const message = await CreateTonProofMessageBytes(input);
        const signature = await this.sign(message);

        return signature;
    }

    getSupportedFeatures(): Promise<Feature[]> {
        return Promise.resolve([
            {
                name: 'SendTransaction',
                maxMessages: 255,
            },
            {
                name: 'SignData',
                types: ['binary', 'cell', 'text'],
            },
        ]);
    }
}
