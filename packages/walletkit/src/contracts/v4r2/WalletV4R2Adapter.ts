// WalletV4R2 Ledger adapter that implements WalletInterface

import {
    Address,
    beginCell,
    Cell,
    loadStateInit,
    SendMode,
    StateInit,
    storeMessage,
    storeStateInit,
    external,
    MessageRelaxed,
    internal,
} from '@ton/core';
import { CHAIN, toHexString } from '@tonconnect/protocol';
import { keyPairFromSeed } from '@ton/crypto';

import { WalletV4R2, WalletV4R2Config } from './WalletV4R2';
import { WalletV4R2CodeCell } from './WalletV4R2.source';
import { defaultWalletIdV4R2 } from './constants';
import {
    WalletInitInterface,
    WalletSigner,
    WalletInitConfigMnemonicInterface,
    WalletInitConfigPrivateKeyInterface,
    WalletInitConfigSignerInterface,
    isWalletInitConfigSigner,
    isWalletInitConfigMnemonic,
    isWalletInitConfigPrivateKey,
} from '../../types/wallet';
import { ApiClient } from '../../types/toncenter/ApiClient';
import { Uint8ArrayToBigInt } from '../../utils/base64';
import { formatWalletAddress } from '../../utils/address';
import { ConnectTransactionParamContent } from '../../types/internal';
import { CallForSuccess } from '../../utils/retry';
import { PrepareSignDataResult } from '../../utils/signData/sign';
import { Hash } from '../../types/primitive';
import { CreateTonProofMessageBytes, TonProofParsedMessage } from '../../utils/tonProof';
import { globalLogger } from '../../core/Logger';
import { MnemonicToKeyPair } from '../../utils/mnemonic';
import { createWalletSigner } from '../../utils/sign';
import { WalletV4R2AdapterConfig } from './types';

const log = globalLogger.createChild('WalletV4R2Adapter');

/**
 * WalletV4R2 adapter that implements WalletInterface for WalletV4R2 contracts
 */
export class WalletV4R2Adapter implements WalletInitInterface {
    private signer: WalletSigner;
    private config: WalletV4R2AdapterConfig;

    readonly walletContract: WalletV4R2;
    readonly client: ApiClient;
    public readonly publicKey: Uint8Array;
    public readonly version = 'v4r2';

    constructor(config: WalletV4R2AdapterConfig) {
        this.config = config;
        this.client = config.tonClient;
        this.signer = config.signer;

        this.publicKey = Uint8Array.from(this.config.publicKey);

        const walletConfig: WalletV4R2Config = {
            publicKey: Uint8ArrayToBigInt(this.publicKey),
            workchain: config.workchain ?? 0,
            seqno: 0,
            subwalletId: config.walletId ?? (defaultWalletIdV4R2 as number),
        };

        this.walletContract = WalletV4R2.createFromConfig(walletConfig, {
            code: WalletV4R2CodeCell,
            workchain: config.workchain ?? 0,
            client: this.client,
        });
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
        _options: { fakeSignature: boolean },
    ): Promise<string> {
        if (input.messages.length === 0) {
            throw new Error('Ledger does not support empty messages');
        }
        if (input.messages.length > 4) {
            throw new Error('WalletV4R2 does not support more than 4 messages');
        }

        let seqno = 0;
        try {
            seqno = await CallForSuccess(async () => this.getSeqno(), 5, 1000);
        } catch (_) {
            //
        }

        const timeout = input.valid_until
            ? Math.min(input.valid_until, Math.floor(Date.now() / 1000) + 600)
            : Math.floor(Date.now() / 1000) + 60;

        try {
            const messages: MessageRelaxed[] = input.messages.map((m) =>
                internal({
                    to: Address.parse(m.address),
                    value: BigInt(m.amount),
                    bounce: true,
                    extracurrency: m.extraCurrency
                        ? Object.fromEntries(Object.entries(m.extraCurrency).map(([k, v]) => [Number(k), BigInt(v)]))
                        : undefined,
                    body: m.payload ? Cell.fromBase64(m.payload) : undefined,
                    init: m.stateInit ? loadStateInit(Cell.fromBase64(m.stateInit).asSlice()) : undefined,
                }),
            );
            const data = this.walletContract.createTransfer({
                seqno: seqno,
                sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
                messages,
                timeout: timeout,
            });

            const signature = await this.sign(Uint8Array.from(data.hash()));
            const signedCell = beginCell().storeBuffer(Buffer.from(signature)).storeSlice(data.asSlice()).endCell();

            const ext = external({
                to: this.walletContract.address,
                init: this.walletContract.init,
                body: signedCell,
            });

            return beginCell().store(storeMessage(ext)).endCell().toBoc().toString('base64');
        } catch (error) {
            log.warn('Failed to get signed send transaction', { error });
            throw error;
        }
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
     * Get the underlying WalletV4R2 contract
     */
    getContract(): WalletV4R2 {
        return this.walletContract;
    }

    /**
     * Get current sequence number
     */
    async getSeqno(): Promise<number> {
        try {
            return await this.walletContract.getSeqno();
        } catch (error) {
            log.warn('Failed to get seqno', { error });
            throw error;
        }
    }

    /**
     * Get wallet's subwallet ID
     */
    async getSubwalletId(): Promise<number> {
        try {
            return await this.walletContract.getSubwalletId();
        } catch (error) {
            log.warn('Failed to get subwallet ID', { error });
            return this.config.walletId ?? defaultWalletIdV4R2;
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
 * Utility function to create WalletV4R2 from any supported configuration
 */
export async function createWalletV4R2(
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
        if (typeof config.privateKey === 'string') {
            const keyPair = keyPairFromSeed(Buffer.from(config.privateKey, 'hex'));
            publicKey = keyPair.publicKey;
            signer = createWalletSigner(keyPair.secretKey);
        } else {
            const keyPair = keyPairFromSeed(config.privateKey as Buffer);
            publicKey = keyPair.publicKey;
            signer = createWalletSigner(config.privateKey);
        }
    } else if (isWalletInitConfigSigner(config)) {
        publicKey =
            typeof config.publicKey === 'string'
                ? Uint8Array.from(Buffer.from(config.publicKey.replace('0x', ''), 'hex'))
                : config.publicKey;
        signer = config.sign;
    } else {
        throw new Error('Unsupported wallet configuration format');
    }

    return new WalletV4R2Adapter({
        publicKey: publicKey,
        signer: signer,
        network: config.network || CHAIN.MAINNET,
        tonClient: options.tonClient,
        walletId: typeof config.walletId === 'bigint' ? Number(config.walletId) : config.walletId,
    });
}
