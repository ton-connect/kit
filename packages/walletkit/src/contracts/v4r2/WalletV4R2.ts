/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// WalletV4R2 contract implementation

import type { Address, Cell, Contract, ContractProvider, Sender, MessageRelaxed, SignatureDomain } from '@ton/core';
import { beginCell, contractAddress, SendMode, storeMessageRelaxed } from '@ton/core';
import type { Maybe } from '@ton/core/dist/utils/maybe';

import type { ApiClient } from '../../types/toncenter/ApiClient';
import { ParseStack } from '../../utils/tvmStack';
import { asAddressFriendly } from '../../utils';

const log = {
    error: (_message: string, _data: unknown) => {
        // console.error(message, data);
    },
};

export interface WalletV4R2Config {
    publicKey: bigint;
    workchain: number;
    seqno: number;
    subwalletId: number;
}

export interface WalletV4R2Options {
    code: Cell;
    workchain: number;
    client: ApiClient;
    domain?: SignatureDomain;
}

/**
 * WalletV4R2 contract implementation
 */
export class WalletV4R2 implements Contract {
    readonly address: Address;
    readonly init?: { code: Cell; data: Cell } | undefined;
    readonly workchain: number;
    readonly publicKey: bigint;
    readonly subwalletId: number;
    public domain?: SignatureDomain;
    private client: ApiClient;

    private constructor(address: Address, init: Maybe<{ code: Cell; data: Cell }>, options: WalletV4R2Options) {
        this.address = address;
        this.init = init ?? undefined;
        this.workchain = options.workchain;
        this.client = options.client;
        this.domain = options.domain;

        if (init) {
            // Extract config from init data
            const dataSlice = init.data.beginParse();
            const _seqno = dataSlice.loadUint(32);
            this.subwalletId = dataSlice.loadUint(32);
            this.publicKey = dataSlice.loadUintBig(256);
        } else {
            this.subwalletId = 0;
            this.publicKey = 0n;
        }
    }

    static createFromConfig(config: WalletV4R2Config, options: WalletV4R2Options): WalletV4R2 {
        const data = beginCell()
            .storeUint(config.seqno, 32)
            .storeUint(config.subwalletId, 32)
            .storeUint(config.publicKey, 256)
            .storeBit(0) // empty plugins dict
            .endCell();

        const init = { code: options.code, data };
        const address = contractAddress(options.workchain, init);

        return new WalletV4R2(address, init, options);
    }

    static createFromAddress(address: Address, options: WalletV4R2Options): WalletV4R2 {
        return new WalletV4R2(address, null, options);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint): Promise<void> {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    /**
     * Get wallet's current sequence number
     */
    async getSeqno(): Promise<number> {
        try {
            const state = await this.client.runGetMethod(asAddressFriendly(this.address), 'seqno');
            if (state.exitCode !== 0) {
                return 0;
            }
            const parsedStack = ParseStack(state.stack);
            if (parsedStack[0]?.type === 'int') {
                return Number(parsedStack[0].value);
            } else {
                throw new Error('Stack is not an int');
            }
        } catch (error) {
            log.error('Failed to get seqno', { error });
            return 0;
        }
    }

    /**
     * Get wallet's current sequence number (async getter)
     */
    get seqno(): Promise<number> {
        return this.getSeqno();
    }

    /**
     * Get wallet's subwallet ID
     */
    async getSubwalletId(): Promise<number> {
        try {
            const state = await this.client.runGetMethod(asAddressFriendly(this.address), 'get_subwallet_id');
            if (state.exitCode !== 0) {
                return this.subwalletId;
            }
            const parsedStack = ParseStack(state.stack);
            if (parsedStack[0]?.type === 'int') {
                return Number(parsedStack[0].value);
            } else {
                throw new Error('Stack is not an int');
            }
        } catch (error) {
            log.error('Failed to get subwallet id', { error });
            return this.subwalletId;
        }
    }

    /**
     * Create transfer message body
     */
    createTransfer(args: {
        seqno: number;
        sendMode: SendMode;
        messages: MessageRelaxed[];
        timeout?: number;
        domain?: SignatureDomain;
    }): Cell {
        const timeout = args.timeout ?? Math.floor(Date.now() / 1000) + 60;

        let body = beginCell()
            .storeUint(this.subwalletId, 32)
            .storeUint(timeout, 32)
            .storeUint(args.seqno, 32)
            .storeUint(0, 8) // Simple transfer
            .storeUint(args.sendMode, 8);

        for (const message of args.messages) {
            body = body.storeRef(beginCell().store(storeMessageRelaxed(message)));
        }

        return body.endCell();
    }

    /**
     * Send internal transfer
     */
    async sendTransfer(
        provider: ContractProvider,
        via: Sender,
        args: {
            seqno: number;
            sendMode: SendMode;
            messages: MessageRelaxed[];
            secretKey: Buffer;
            timeout?: number;
        },
    ): Promise<void> {
        const transfer = this.createTransfer(args);
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: transfer,
            value: 0n,
        });
    }
}
