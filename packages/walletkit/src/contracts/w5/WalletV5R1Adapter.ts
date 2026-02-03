/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// WalletV5R1 adapter that implements WalletInterface

import type { StateInit, SignatureDomain } from '@ton/core';
import {
    Address,
    beginCell,
    Cell,
    Dictionary,
    domainSign,
    loadStateInit,
    SendMode,
    storeMessage,
    storeStateInit,
} from '@ton/core';
import { external, internal } from '@ton/core';

import { WalletV5, WalletV5R1Id } from './WalletV5R1';
import { WalletV5R1CodeCell } from './WalletV5R1.source';
import { globalLogger } from '../../core/Logger';
import { WalletKitError, ERROR_CODES } from '../../errors';
import { FakeSignature } from '../../utils/sign';
import { asAddressFriendly, formatWalletAddress } from '../../utils/address';
import { CallForSuccess } from '../../utils/retry';
import { ActionSendMsg, packActionsList } from './actions';
import type { ApiClient } from '../../types/toncenter/ApiClient';
import { HexToBigInt, HexToUint8Array, Uint8ArrayToHex } from '../../utils/base64';
import { CreateTonProofMessageBytes } from '../../utils/tonProof';
import type { WalletId } from '../../utils/walletId';
import { createWalletId } from '../../utils/walletId';
import type { WalletAdapter, WalletSigner } from '../../api/interfaces';
import type {
    Network,
    PreparedSignData,
    ProofMessage,
    TransactionRequest,
    UserFriendlyAddress,
    Hex,
    Base64String,
} from '../../api/models';
import type { Feature } from '../../types/jsBridge';

const log = globalLogger.createChild('WalletV5R1Adapter');

export const defaultWalletIdV5R1 = 2147483409;

/**
 * Configuration for creating a WalletV5R1 adapter
 */
export interface WalletV5R1AdapterConfig {
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
    /** Signature domain */
    domain?: SignatureDomain;
}

/**
 * WalletV5R1 adapter that implements WalletInterface for WalletV5 contracts
 */
export class WalletV5R1Adapter implements WalletAdapter {
    // private keyPair: { publicKey: Uint8Array; secretKey: Uint8Array };
    private signer: WalletSigner;
    private config: WalletV5R1AdapterConfig;

    readonly walletContract: WalletV5;
    readonly client: ApiClient;
    public readonly publicKey: Hex;
    public readonly version = 'v5r1';

    /**
     * Static factory method to create a WalletV5R1Adapter
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
            domain?: SignatureDomain;
        },
    ): Promise<WalletV5R1Adapter> {
        return new WalletV5R1Adapter({
            signer,
            publicKey: signer.publicKey,
            tonClient: options.client,
            network: options.network,
            walletId: options.walletId,
            workchain: options.workchain,
            domain: options.domain,
        });
    }

    constructor(config: WalletV5R1AdapterConfig) {
        this.config = config;
        this.client = config.tonClient;
        this.signer = config.signer;

        this.publicKey = this.config.publicKey;
        this.walletContract = WalletV5.createFromConfig(
            {
                publicKey: HexToBigInt(this.publicKey),
                seqno: 0,
                signatureAllowed: true,
                walletId:
                    typeof config.walletId === 'bigint'
                        ? Number(config.walletId)
                        : (config.walletId ?? defaultWalletIdV5R1),
                extensions: Dictionary.empty(),
            },
            {
                code: WalletV5R1CodeCell,
                workchain: config.workchain ?? 0,
                client: this.client,
                domain: config.domain,
            },
        );
    }

    getPublicKey(): Hex {
        return this.publicKey;
    }

    getClient(): ApiClient {
        return this.client;
    }

    /**
     * Sign raw bytes with wallet's private key
     */
    async sign(bytes: Iterable<number>): Promise<Hex> {
        return this.signer.sign(bytes);
    }

    getNetwork(): Network {
        return this.config.network;
    }

    /**
     * Get wallet's TON address
     */
    getAddress(options?: { testnet?: boolean }): UserFriendlyAddress {
        return formatWalletAddress(this.walletContract.address, options?.testnet);
    }

    getWalletId(): WalletId {
        return createWalletId(this.getNetwork(), this.getAddress());
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
                        log.warn('Failed to load payload', { error });
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
                        log.warn('Failed to load state init', { error });
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

        const transfer = await this.createBodyV5(seqno, walletId, actions, createBodyOptions);

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
     * Get the underlying WalletV5 contract
     */
    getContract(): WalletV5 {
        return this.walletContract;
    }

    /**
     * Get current sequence number
     */
    async getSeqno(): Promise<number> {
        try {
            return await this.walletContract.seqno;
        } catch (error) {
            log.warn('Failed to get seqno', { error });
            // return 0;
            throw error;
        }
    }

    /**
     * Get wallet ID
     */
    async getWalletV5R1Id(): Promise<WalletV5R1Id> {
        try {
            return this.walletContract.walletId;
        } catch (error) {
            log.warn('Failed to get wallet ID', { error });
            const walletId = this.config.walletId;
            const subwalletNumber = typeof walletId === 'bigint' ? Number(walletId) : walletId || 0;
            return new WalletV5R1Id({ subwalletNumber });
        }
    }

    /**
     * Check if wallet is deployed on the network
     */
    async isDeployed(): Promise<boolean> {
        try {
            const state = await this.client.getAccountState(asAddressFriendly(this.walletContract.address));
            return state.status === 'active';
        } catch (error) {
            log.warn('Failed to check deployment status', { error });
            return false;
        }
    }

    async createBodyV5(
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
            .storeSlice(actionsList.beginParse())
            .endCell();

        const signingData = payload.hash();
        let signature: Hex;
        if (options.fakeSignature) {
            signature = FakeSignature(signingData);
        } else if (this.walletContract.domain) {
            // Use domainSign if domain is specified
            if (this.signer.secretKey) {
                // If secretKey is available, use domainSign directly
                signature = Uint8ArrayToHex(
                    domainSign({
                        data: Buffer.from(signingData),
                        secretKey: this.signer.secretKey,
                        domain: this.walletContract.domain,
                    }),
                );
            } else {
                // Otherwise, use signer which should handle domain internally if supported
                signature = await this.sign(signingData);
            }
        } else {
            signature = await this.sign(signingData);
        }
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

    getSupportedFeatures(): Feature[] {
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
