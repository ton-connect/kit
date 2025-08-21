// WalletV5R1 adapter that implements WalletInterface

import {
    beginCell,
    Cell,
    Dictionary,
    loadStateInit,
    SendMode,
    StateInit,
    storeMessage,
    storeStateInit,
} from '@ton/core';
import { TonClient } from '@ton/ton';
import { KeyPair, keyPairFromSeed } from '@ton/crypto';
import { external, internal } from '@ton/core';

import type { TonNetwork, WalletInterface } from '../../types';
import { WalletInitConfigMnemonic, WalletInitConfigPrivateKey } from '../../types';
import { WalletV5, WalletId } from './WalletV5R1';
import { WalletV5R1CodeCell } from './WalletV5R1.source';
import { globalLogger } from '../../core/Logger';
import { DefaultSignature, FakeSignature } from '../../utils/sign';
import { formatWalletAddress } from '../../utils/address';
import { MnemonicToKeyPair } from '../../utils/mnemonic';
import { CallForSuccess } from '../../utils/retry';
import { ConnectTransactionParamContent } from '../../types/internal';
import { ActionSendMsg, packActionsList } from './actions';

const log = globalLogger.createChild('WalletV5R1Adapter');

/**
 * Configuration for creating a WalletV5R1 adapter
 */
export interface WalletV5R1AdapterConfig {
    /** Private key buffer (32 bytes) */
    privateKey: Uint8Array;
    /** Wallet ID configuration */
    walletId?: number;
    /** Shared TON client instance */
    tonClient: TonClient;
    /** Network */
    network: TonNetwork;
}

/**
 * WalletV5R1 adapter that implements WalletInterface for WalletV5 contracts
 */
export class WalletV5R1Adapter implements WalletInterface {
    private keyPair: { publicKey: Uint8Array; secretKey: Uint8Array };
    private walletContract: WalletV5;
    private client: TonClient;
    private config: WalletV5R1AdapterConfig;

    public readonly publicKey: Uint8Array;
    public readonly version = 'v5r1';

    constructor(config: WalletV5R1AdapterConfig) {
        this.config = config;
        this.client = config.tonClient;

        // Initialize key pair - this will be properly set in initialize()
        // this.keyPair = { publicKey: Buffer.alloc(32), secretKey: Buffer.alloc(64) };
        // this.publicKey = '';
        const privateKey =
            this.config.privateKey.length === 32 ? this.config.privateKey : this.config.privateKey.slice(0, 32);
        this.keyPair = keyPairFromSeed(Buffer.from(privateKey));
        this.publicKey = Uint8Array.from(this.keyPair.publicKey);
        this.walletContract = WalletV5.createFromConfig(
            {
                publicKey: this.keyPair.publicKey,
                seqno: 0,
                signatureAllowed: true,
                walletId: 2147483409n, // todo fix
                extensions: Dictionary.empty(),
            },
            WalletV5R1CodeCell,
            0,
        );
    }

    /**
     * Sign raw bytes with wallet's private key
     */
    async sign(bytes: Uint8Array): Promise<Uint8Array> {
        return DefaultSignature(bytes, this.keyPair.secretKey);
    }

    /**
     * Get wallet's TON address
     */
    getAddress(options?: { testnet?: boolean }): string {
        return formatWalletAddress(this.walletContract.address, options?.testnet);
    }

    async getSignedExternal(
        input: ConnectTransactionParamContent,
        options: { fakeSignature: boolean },
    ): Promise<string> {
        // if (keyPair.secretKey.length === 32) {
        //     keyPair.secretKey = Buffer.concat([Uint8Array.from(keyPair.secretKey), Uint8Array.from(keyPair.publicKey)]);
        // }

        const actions = packActionsList(
            input.messages.map((m) => {
                const msg = internal({
                    body: m.payload ? Cell.fromBase64(m.payload) : undefined,
                    to: m.address,
                    value: BigInt(m.amount),
                    bounce: false,
                    extracurrency: m.extraCurrency
                        ? Object.fromEntries(Object.entries(m.extraCurrency).map(([k, v]) => [Number(k), BigInt(v)]))
                        : undefined,
                });

                if (m.stateInit) {
                    msg.init = loadStateInit(Cell.fromBase64(m.stateInit).asSlice());
                }
                return new ActionSendMsg(SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS, msg);
            }),
        );

        let seqno = 0;
        try {
            seqno = await CallForSuccess(async () => this.getSeqno(), 5, 1000);
        } catch (_) {
            //
        }
        const provider = this.client.provider(this.walletContract.address);
        let walletId;
        try {
            walletId = (await this.walletContract.getWalletId(provider)).serialized; // WalletId.deserialize(subwalletId);
        } catch (_) {
            //
        }

        if (!walletId) {
            throw new Error('Failed to get seqno or walletId');
        }

        const transfer = await this.createBodyV5(seqno, walletId, actions, options);

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
            const provider = this.client.provider(this.walletContract.address);
            return await this.walletContract.getSeqno(provider);
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
            const provider = this.client.provider(this.walletContract.address);
            return await this.walletContract.getWalletId(provider);
        } catch (error) {
            log.warn('Failed to get wallet ID', { error });
            return new WalletId({ subwalletNumber: this.config.walletId || 0 });
        }
    }

    /**
     * Check if wallet is deployed on the network
     */
    async isDeployed(): Promise<boolean> {
        try {
            const state = await this.client.getContractState(this.walletContract.address);
            return state.state === 'active';
        } catch (error) {
            log.warn('Failed to check deployment status', { error });
            return false;
        }
    }

    async createBodyV5(seqno: number, walletId: bigint, actionsList: Cell, options: { fakeSignature: boolean }) {
        const Opcodes = {
            auth_signed: 0x7369676e,
        };

        const expireAt = Math.floor(Date.now() / 1000) + 60;
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
}

/**
 * Utility function to create WalletV5R1 from any supported configuration
 */
export async function createWalletV5R1(
    config: WalletInitConfigMnemonic | WalletInitConfigPrivateKey,
    options: {
        tonClient: TonClient;
    },
): Promise<WalletInterface> {
    let keyPair: {
        publicKey: Uint8Array;
        secretKey: Uint8Array;
    };
    if (config instanceof WalletInitConfigMnemonic) {
        keyPair = await MnemonicToKeyPair(config.mnemonic, config.mnemonicType);
    } else if (config instanceof WalletInitConfigPrivateKey) {
        keyPair = keyPairFromSeed(Buffer.from(config.privateKey, 'hex'));
    } else {
        throw new Error('Unsupported wallet configuration format');
    }

    return new WalletV5R1Adapter({
        privateKey: keyPair.secretKey,
        network: config.network || 'mainnet',
        tonClient: options.tonClient,
        walletId: config.walletId,
    });
}
