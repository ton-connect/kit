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
} from '@ton/core';
import { CHAIN, toHexString } from '@tonconnect/protocol';
import { TonTransport } from '@ton-community/ton-ledger';
// import { Transport } from '@ledgerhq/hw-transport-webusb';

import { WalletV4R2, WalletV4R2Config } from './WalletV4R2';
import { WalletV4R2CodeCell } from './WalletV4R2.source';
import { globalLogger } from '../../core/Logger';
import { formatWalletAddress } from '../../utils/address';
import { CallForSuccess } from '../../utils/retry';
import { ConnectTransactionParamContent } from '../../types/internal';
import { WalletInitInterface, WalletInitConfigLedgerInterface, isWalletInitConfigLedger } from '../../types/wallet';
import { ApiClient } from '../../types/toncenter/ApiClient';
import { uint8ArrayToBigInt } from '../../utils/base64';
import { PrepareSignDataResult } from '../../utils/signData/sign';
import { Hash } from '../../types/primitive';
import { TonProofParsedMessage } from '../../utils/tonProof';

const log = globalLogger.createChild('WalletV4R2LedgerAdapter');

export const defaultWalletIdV4R2 = 698983191;

/**
 * Configuration for creating a WalletV4R2 Ledger adapter
 */
export interface WalletV4R2LedgerAdapterConfig {
    /** Ledger TON transport */
    tonTransport: TonTransport;
    /** Derivation path for signing */
    path: number[];
    /** Public key from Ledger */
    publicKey: Uint8Array;
    /** Wallet ID configuration */
    walletId?: number;
    /** Shared TON client instance */
    tonClient: ApiClient;
    /** Network */
    network: CHAIN;
    /** Workchain */
    workchain?: number;
}

/**
 * WalletV4R2 Ledger adapter that implements WalletInterface for WalletV4R2 contracts
 * using Ledger hardware wallet for signing
 */
export class WalletV4R2LedgerAdapter implements WalletInitInterface {
    private tonTransport: TonTransport;
    private config: WalletV4R2LedgerAdapterConfig;
    private derivationPath: number[];

    readonly walletContract: WalletV4R2;
    readonly client: ApiClient;
    public readonly publicKey: Uint8Array;
    public readonly version = 'v4r2';

    constructor(config: WalletV4R2LedgerAdapterConfig) {
        this.config = config;
        this.client = config.tonClient;
        this.tonTransport = config.tonTransport;
        this.derivationPath = config.path;

        this.publicKey = Uint8Array.from(this.config.publicKey);

        const walletConfig: WalletV4R2Config = {
            publicKey: uint8ArrayToBigInt(this.publicKey),
            workchain: config.workchain ?? 0,
            seqno: 0,
            subwalletId: config.walletId ?? defaultWalletIdV4R2,
        };

        this.walletContract = WalletV4R2.createFromConfig(walletConfig, {
            code: WalletV4R2CodeCell,
            workchain: config.workchain ?? 0,
            client: this.client,
        });
    }

    /**
     * Sign raw bytes with Ledger hardware wallet
     */
    // async sign(bytes: Uint8Array): Promise<Uint8Array> {
    //     try {
    //         const signature = await this.tonTransport.sign(this.derivationPath, Buffer.from(bytes));
    //         return new Uint8Array(signature);
    //     } catch (error) {
    //         log.error('Failed to sign with Ledger', { error });
    //         throw new Error(`Ledger signing failed: ${error}`);
    //     }
    // }

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
        if (input.messages.length > 1) {
            throw new Error('Ledger does not support multiple messages');
        }
        const message = input.messages[0];

        let seqno = 0;
        try {
            seqno = await CallForSuccess(async () => this.getSeqno(), 5, 1000);
        } catch (_) {
            //
        }

        const timeout = input.valid_until
            ? Math.min(input.valid_until, Math.floor(Date.now() / 1000) + 600)
            : Math.floor(Date.now() / 1000) + 60;

        const signedCell = await this.tonTransport.signTransaction(this.derivationPath, {
            to: Address.parse(message.address),
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            seqno: seqno,
            timeout: timeout,
            bounce: true,
            amount: BigInt(message.amount),
            stateInit: message.stateInit ? loadStateInit(Cell.fromBase64(message.stateInit).asSlice()) : undefined,
            payload: message.payload
                ? {
                      type: 'unsafe',
                      message: Cell.fromBase64(message.payload),
                  }
                : undefined,
            // extraCurrency: message.extraCurrency
            //     ? {
            //           index: message.extraCurrency,
            //           amount: BigInt(message.extraCurrency.value),
            //       }
            //     : undefined,
        });

        // Create transfer body for WalletV4R2
        // const transfer = await this.createTransferBody(seqno, timeout, messages, options.fakeSignature);

        const ext = external({
            to: this.walletContract.address,
            init: this.walletContract.init,
            body: signedCell,
        });

        return beginCell().store(storeMessage(ext)).endCell().toBoc().toString('base64');
        // return signedCell.toBoc().toString('base64');
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

    /**
     * Create transfer body for WalletV4R2 using Ledger signing
     */
    // private async createTransferBody(
    //     seqno: number,
    //     timeout: number,
    //     messages: any[],
    //     fakeSignature: boolean,
    // ): Promise<Cell> {
    //     const subwalletId = this.config.walletId ?? defaultWalletIdV4R2;

    //     // Build the message body
    //     let body = beginCell().storeUint(subwalletId, 32).storeUint(timeout, 32).storeUint(seqno, 32).storeUint(0, 8); // Simple transfer

    //     for (const message of messages) {
    //         body = body
    //             .storeUint(SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS, 8)
    //             .storeRef(beginCell().store(storeMessage(message, { forceRef: false })));
    //     }

    //     const messageCell = body.endCell();
    //     const signingData = messageCell.hash();

    //     let signature: Uint8Array;
    //     if (fakeSignature) {
    //         signature = FakeSignature(signingData);
    //     } else {
    //         signature = await this.sign(signingData);
    //     }

    //     return beginCell().storeBuffer(Buffer.from(signature)).storeSlice(messageCell.beginParse()).endCell();
    // }

    async getSignedSignData(_input: PrepareSignDataResult): Promise<Hash> {
        // const signature = await this.sign(input.hash);
        // const signature = await this.ton
        // return ('0x' + toHexString(signature)) as Hash;
        throw new Error('Not implemented');
    }

    async getSignedTonProof(input: TonProofParsedMessage): Promise<Hash> {
        // todo - add ledger max len checks
        const { signature } = await this.tonTransport.getAddressProof(this.derivationPath, {
            domain: input.domain.value,
            timestamp: input.timstamp,
            payload: Buffer.from(input.payload),
        });
        return ('0x' + toHexString(signature)) as Hash;
    }
}

/**
 * Utility function to create Ledger derivation path
 */
export function createLedgerPath(testnet: boolean = false, workchain: number = 0, account: number = 0): number[] {
    const network = testnet ? 1 : 0;
    const chain = workchain === -1 ? 255 : 0;
    return [44, 607, network, chain, account, 0];
}

/**
 * Utility function to create WalletV4R2 Ledger adapter from Ledger configuration
 */
export async function createWalletV4R2Ledger(
    config: WalletInitConfigLedgerInterface,
    options: {
        tonClient: ApiClient;
    },
): Promise<WalletInitInterface> {
    if (!isWalletInitConfigLedger(config)) {
        throw new Error('Invalid Ledger configuration');
    }

    // Create TonTransport from the provided transport
    const tonTransport = new TonTransport(config.transport);

    try {
        // Get address and public key from Ledger
        const response = await tonTransport.getAddress(config.path, {
            chain: config.workchain ?? 0,
            bounceable: false,
            testOnly: config.network === CHAIN.TESTNET,
            walletVersion: 'v4',
        });

        return new WalletV4R2LedgerAdapter({
            tonTransport: tonTransport,
            path: config.path,
            publicKey: response.publicKey,
            walletId: config.walletId,
            tonClient: options.tonClient,
            network: config.network || CHAIN.MAINNET,
            workchain: config.workchain,
        });
    } catch (error) {
        log.error('Failed to create Ledger adapter', { error });
        throw new Error(`Failed to initialize Ledger wallet: ${error}`);
    }
}
