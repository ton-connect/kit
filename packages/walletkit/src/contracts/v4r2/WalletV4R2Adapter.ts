/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

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
import { CHAIN } from '@tonconnect/protocol';

import { WalletV4R2, WalletV4R2Config } from './WalletV4R2';
import { WalletV4R2CodeCell } from './WalletV4R2.source';
import { defaultWalletIdV4R2 } from './constants';
import { IWalletAdapter, WalletSigner } from '../../types/wallet';
import { ApiClient } from '../../types/toncenter/ApiClient';
import { HexToBigInt, HexToUint8Array } from '../../utils/base64';
import { formatWalletAddress } from '../../utils/address';
import { ConnectTransactionParamContent } from '../../types/internal';
import { CallForSuccess } from '../../utils/retry';
import { PrepareSignDataResult } from '../../utils/signData/sign';
import { Hex } from '../../types/primitive';
import { CreateTonProofMessageBytes, TonProofParsedMessage } from '../../utils/tonProof';
import { globalLogger } from '../../core/Logger';
import { WalletV4R2AdapterConfig } from './types';
import { createWalletId, WalletId } from '../../utils/walletId';

const log = globalLogger.createChild('WalletV4R2Adapter');

/**
 * WalletV4R2 adapter that implements WalletInterface for WalletV4R2 contracts
 */
export class WalletV4R2Adapter implements IWalletAdapter {
    private signer: WalletSigner;
    private config: WalletV4R2AdapterConfig;

    readonly walletContract: WalletV4R2;
    readonly client: ApiClient;
    public readonly publicKey: Hex;
    public readonly version = 'v4r2';

    /**
     * Static factory method to create a WalletV4R2Adapter
     * @param signer - Signer function with publicKey property (from Signer utility)
     * @param options - Configuration options for the wallet
     */
    static async create(
        signer: WalletSigner,
        options: {
            client: ApiClient;
            network: CHAIN;
            walletId?: number | bigint;
            workchain?: number;
        },
    ): Promise<WalletV4R2Adapter> {
        return new WalletV4R2Adapter({
            signer,
            publicKey: signer.publicKey,
            tonClient: options.client,
            network: options.network,
            walletId: typeof options.walletId === 'bigint' ? Number(options.walletId) : options.walletId,
            workchain: options.workchain,
        });
    }

    constructor(config: WalletV4R2AdapterConfig) {
        this.config = config;
        this.client = config.tonClient;
        this.signer = config.signer;

        this.publicKey = this.config.publicKey;

        const walletConfig: WalletV4R2Config = {
            publicKey: HexToBigInt(this.publicKey),
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
        return await this.signer.sign(bytes);
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

    getWalletId(): WalletId {
        return createWalletId(this.getNetwork(), this.getAddress());
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
            const signedCell = beginCell()
                .storeBuffer(Buffer.from(HexToUint8Array(signature)))
                .storeSlice(data.asSlice())
                .endCell();

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

    async getSignedSignData(input: PrepareSignDataResult): Promise<Hex> {
        const signature = await this.sign(HexToUint8Array(input.hash));
        return signature;
    }

    async getSignedTonProof(input: TonProofParsedMessage): Promise<Hex> {
        const message = await CreateTonProofMessageBytes(input);
        const signature = await this.sign(message);

        return signature;
    }
}
