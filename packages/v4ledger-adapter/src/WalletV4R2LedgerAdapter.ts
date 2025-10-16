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
import Transport from '@ledgerhq/hw-transport';
import {
    IWalletAdapter,
    ApiClient,
    formatWalletAddress,
    CallForSuccess,
    ConnectTransactionParamContent,
    PrepareSignDataResult,
    Hash,
    TonProofParsedMessage,
    HashToBigInt,
    Uint8ArrayToHash,
    HashToUint8Array,
} from '@ton/walletkit';

import { WalletV4R2, WalletV4R2Config } from './WalletV4R2';
import { WalletV4R2CodeCell } from './WalletV4R2.source';
import { defaultWalletIdV4R2 } from './constants';
import { WalletInitConfigLedgerInterface, WalletV4R2LedgerAdapterConfig } from './types';

const log = {
    warn: (_message: string, _error: unknown) => {},
};

export function createWalletInitConfigLedger(params: WalletInitConfigLedgerInterface): WalletInitConfigLedgerInterface {
    return {
        createTransport: params.createTransport,
        path: params.path,
        version: params.version ?? 'v4r2',
        walletId: params.walletId ?? 698983191,
        network: params.network ?? CHAIN.MAINNET,
        workchain: params.workchain ?? 0,
        accountIndex: params.accountIndex ?? 0,
        publicKey: params.publicKey,
    };
}

// const log = globalLogger.createChild('WalletV4R2LedgerAdapter');

/**
 * WalletV4R2 Ledger adapter that implements WalletInterface for WalletV4R2 contracts
 * using Ledger hardware wallet for signing
 */
export class WalletV4R2LedgerAdapter implements IWalletAdapter {
    private createTransport: () => Promise<Transport>;
    private config: WalletV4R2LedgerAdapterConfig;
    private derivationPath: number[];

    readonly walletContract: WalletV4R2;
    readonly client: ApiClient;
    public readonly publicKey: Hash;
    public readonly version = 'v4r2';

    constructor(config: WalletV4R2LedgerAdapterConfig) {
        this.config = config;
        this.client = config.tonClient;
        this.createTransport = config.createTransport;
        this.derivationPath = config.path;

        this.publicKey = Uint8ArrayToHash(this.config.publicKey);

        const walletConfig: WalletV4R2Config = {
            publicKey: HashToBigInt(this.publicKey),
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

        let transport: Transport | undefined;
        try {
            transport = await this.createTransport();
            const tonTransport = new TonTransport(transport);
            if (!(await this.verifyPublicKey(tonTransport))) {
                throw new Error('Public key from Ledger does not match');
            }

            const signedCell = await tonTransport.signTransaction(this.derivationPath, {
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
            });

            const ext = external({
                to: this.walletContract.address,
                init: this.walletContract.init,
                body: signedCell,
            });

            return beginCell().store(storeMessage(ext)).endCell().toBoc().toString('base64');
        } finally {
            if (transport) {
                await transport.close();
            }
        }
    }

    /**
     * Get wallet's current balance in nanotons
     */
    async getBalance(): Promise<string> {
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

    async getSignedSignData(_input: PrepareSignDataResult): Promise<Hash> {
        throw new Error('Not implemented');
    }

    async getSignedTonProof(input: TonProofParsedMessage): Promise<Hash> {
        // todo - add ledger max len checks
        let transport: Transport | undefined;
        try {
            transport = await this.createTransport();
            const tonTransport = new TonTransport(transport);
            if (!(await this.verifyPublicKey(tonTransport))) {
                throw new Error('Public key from Ledger does not match');
            }

            const { signature } = await tonTransport.getAddressProof(this.derivationPath, {
                domain: input.domain.value,
                timestamp: input.timstamp,
                payload: Buffer.from(input.payload),
            });
            return ('0x' + toHexString(signature)) as Hash;
        } finally {
            if (transport) {
                await transport.close();
            }
        }
    }

    async verifyPublicKey(tonTransport: TonTransport): Promise<boolean> {
        const addressResponse = await tonTransport.getAddress(this.derivationPath, {
            chain: this.config.workchain ?? 0,
            bounceable: false,
            testOnly: this.config.network === CHAIN.TESTNET,
            walletVersion: 'v4',
        });
        if (!addressResponse.publicKey) {
            return false;
        }
        const publicKey = HashToUint8Array(this.publicKey);
        if (!isUint8ArrayEqual(publicKey, addressResponse.publicKey)) {
            return false;
        }
        return true;
    }
}

function isUint8ArrayEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
        return false;
    }
    return a.every((value, index) => value === b[index]);
}
