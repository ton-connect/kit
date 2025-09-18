// WalletV5R1 adapter that implements WalletInterface

import {
    Address,
    beginCell,
    Cell,
    Dictionary,
    loadStateInit,
    SendMode,
    StateInit,
    storeMessage,
    storeStateInit,
} from '@ton/core';
import { keyPairFromSeed } from '@ton/crypto';
import { external, internal } from '@ton/core';
import { CHAIN, toHexString } from '@tonconnect/protocol';

import { WalletV5, WalletId } from './WalletV5R1';
import { WalletV5R1CodeCell } from './WalletV5R1.source';
import { globalLogger } from '../../core/Logger';
import { createWalletSigner, FakeSignature } from '../../utils/sign';
import { formatWalletAddress } from '../../utils/address';
import { MnemonicToKeyPair } from '../../utils/mnemonic';
import { CallForSuccess } from '../../utils/retry';
import { ConnectTransactionParamContent } from '../../types/internal';
import { ActionSendMsg, packActionsList } from './actions';
import {
    WalletInitInterface,
    WalletInitConfigMnemonicInterface,
    WalletInitConfigPrivateKeyInterface,
    WalletInitConfigSignerInterface,
    isWalletInitConfigSigner,
    isWalletInitConfigMnemonic,
    isWalletInitConfigPrivateKey,
    WalletSigner,
} from '../../types/wallet';
import { ApiClient } from '../../types/toncenter/ApiClient';
import { Uint8ArrayToBigInt } from '../../utils/base64';
import { PrepareSignDataResult } from '../../utils/signData/sign';
import { Hash } from '../../types/primitive';
import { CreateTonProofMessageBytes, TonProofParsedMessage } from '../../utils/tonProof';

const log = globalLogger.createChild('WalletV5R1Adapter');

export const defaultWalletIdV5R1 = 2147483409;

/**
 * Configuration for creating a WalletV5R1 adapter
 */
export interface WalletV5R1AdapterConfig {
    /** Signer function */
    signer: WalletSigner;
    /** Public key */
    publicKey: Uint8Array;
    /** Wallet ID configuration */
    walletId?: number | bigint;
    /** Shared TON client instance */
    tonClient: ApiClient;
    /** Network */
    network: CHAIN;
}

/**
 * WalletV5R1 adapter that implements WalletInterface for WalletV5 contracts
 */
export class WalletV5R1Adapter implements WalletInitInterface {
    // private keyPair: { publicKey: Uint8Array; secretKey: Uint8Array };
    private signer: WalletSigner;
    private config: WalletV5R1AdapterConfig;

    readonly walletContract: WalletV5;
    readonly client: ApiClient;
    public readonly publicKey: Uint8Array;
    public readonly version = 'v5r1';

    constructor(config: WalletV5R1AdapterConfig) {
        this.config = config;
        this.client = config.tonClient;
        this.signer = config.signer;

        this.publicKey = Uint8Array.from(this.config.publicKey);
        this.walletContract = WalletV5.createFromConfig(
            {
                publicKey: Uint8ArrayToBigInt(this.publicKey),
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
                workchain: 0,
                client: this.client,
            },
        );
    }

    /**
     * Sign raw bytes with wallet's private key
     */
    async sign(bytes: Uint8Array): Promise<Uint8Array> {
        return this.signer(bytes);
    }

    getNetwork(): CHAIN {
        return this.config.network;
    }

    /**
     * Get wallet's TON address
     */
    getAddress(options?: { testnet?: boolean }): string {
        return formatWalletAddress(this.walletContract.address, options?.testnet);
    }

    async getSignedSendTransaction(
        input: ConnectTransactionParamContent,
        options: { fakeSignature: boolean },
    ): Promise<string> {
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
                        throw new Error('Couldnt parse payload');
                    }
                }

                if (m.stateInit) {
                    try {
                        msg.init = loadStateInit(Cell.fromBase64(m.stateInit).asSlice());
                    } catch (error) {
                        log.warn('Failed to load state init', { error });
                        throw new Error('Couldnt parse stateInit');
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
        if (input.valid_until) {
            const now = Math.floor(Date.now() / 1000);
            const maxValidUntil = now + 600;
            if (input.valid_until < now) {
                throw new Error('Valid until is in the past');
            } else if (input.valid_until > maxValidUntil) {
                createBodyOptions.validUntil = maxValidUntil;
            } else {
                createBodyOptions.validUntil = input.valid_until;
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
        return beginCell().store(storeMessage(ext)).endCell().toBoc().toString('base64');
    }

    /**
     * Get wallet's current balance in nanotons
     */
    async getBalance(): Promise<bigint> {
        try {
            const balance = await CallForSuccess(
                async () => this.client.getBalance(this.walletContract.address),
                5,
                1000,
            );
            return balance;
        } catch (error) {
            log.warn('Failed to get balance', { error });
            throw error;
        }
    }

    /**
     * Get state init for wallet deployment
     */
    async getStateInit(): Promise<string> {
        if (!this.walletContract.init) {
            throw new Error('Wallet contract not properly initialized');
        }

        const stateInit = beginCell()
            .store(storeStateInit(this.walletContract.init as unknown as StateInit))
            .endCell();
        return stateInit.toBoc().toString('base64');
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
    async getWalletId(): Promise<WalletId> {
        try {
            return this.walletContract.walletId;
        } catch (error) {
            log.warn('Failed to get wallet ID', { error });
            const walletId = this.config.walletId;
            const subwalletNumber = typeof walletId === 'bigint' ? Number(walletId) : walletId || 0;
            return new WalletId({ subwalletNumber });
        }
    }

    /**
     * Check if wallet is deployed on the network
     */
    async isDeployed(): Promise<boolean> {
        try {
            const state = await this.client.getAccountState(this.walletContract.address);
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
        const signature = options.fakeSignature ? FakeSignature(signingData) : await this.sign(signingData);
        return beginCell().storeSlice(payload.beginParse()).storeBuffer(Buffer.from(signature)).endCell();
    }

    async getSignedSignData(input: PrepareSignDataResult): Promise<Hash> {
        const signature = await this.sign(input.hash);
        return ('0x' + toHexString(signature)) as Hash;
    }

    async getSignedTonProof(input: TonProofParsedMessage): Promise<Hash> {
        const message = await CreateTonProofMessageBytes(input);
        const signature = await this.sign(message);

        return ('0x' + toHexString(signature)) as Hash;
    }
}

/**
 * Utility function to create WalletV5R1 from any supported configuration
 */
export async function createWalletV5R1(
    config: WalletInitConfigMnemonicInterface | WalletInitConfigPrivateKeyInterface | WalletInitConfigSignerInterface,
    options: {
        tonClient: ApiClient;
    },
): Promise<WalletInitInterface> {
    let publicKey: Uint8Array;
    let signer: WalletSigner;
    if (isWalletInitConfigMnemonic(config)) {
        const keyPair = await MnemonicToKeyPair(config.mnemonic, config.mnemonicType);
        publicKey = keyPair.publicKey;
        signer = createWalletSigner(keyPair.secretKey);
    } else if (isWalletInitConfigPrivateKey(config)) {
        const keyPair = keyPairFromSeed(Buffer.from(config.privateKey, 'hex'));
        publicKey = keyPair.publicKey;
        signer = createWalletSigner(keyPair.secretKey);
    } else if (isWalletInitConfigSigner(config)) {
        publicKey = config.publicKey;
        signer = config.sign;
    } else {
        throw new Error('Unsupported wallet configuration format');
    }

    return new WalletV5R1Adapter({
        publicKey: publicKey,
        signer: signer,
        network: config.network || CHAIN.MAINNET,
        tonClient: options.tonClient,
        walletId: config.walletId,
    });
}
