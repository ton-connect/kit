/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Address, Cell, Contract, Sender, ContractProvider, AccountStatus, SignatureDomain } from '@ton/core';
import { beginCell, contractAddress, Dictionary, SendMode } from '@ton/core';

import type { ApiClient } from '../../types/toncenter/ApiClient';
import type { WalletOptions } from '../Wallet';
export interface WalletV5Options extends WalletOptions {
    domain?: SignatureDomain;
}
import { defaultWalletIdV5R1 } from './WalletV5R1Adapter';
import { ParseStack } from '../../utils';
import { asAddressFriendly } from '../../utils';

export type WalletV5Config = {
    signatureAllowed: boolean;
    seqno: number;
    walletId: number;
    publicKey: bigint;
    extensions: Dictionary<bigint, bigint>;
};

export function walletV5ConfigToCell(config: WalletV5Config): Cell {
    return beginCell()
        .storeBit(config.signatureAllowed)
        .storeUint(config.seqno, 32)
        .storeUint(config.walletId, 32)
        .storeUint(config.publicKey, 256)
        .storeDict(config.extensions, Dictionary.Keys.BigUint(256), Dictionary.Values.BigInt(1))
        .endCell();
}

export const Opcodes = {
    action_send_msg: 0x0ec3c86d,
    action_set_code: 0xad4de08e,
    action_extended_set_data: 0x1ff8ea0b,
    action_extended_add_extension: 0x02,
    action_extended_remove_extension: 0x03,
    action_extended_set_signature_auth_allowed: 0x04,
    auth_extension: 0x6578746e,
    auth_signed: 0x7369676e,
    auth_signed_internal: 0x73696e74,
};

export class WalletV5R1Id {
    static deserialize(walletId: number): WalletV5R1Id {
        return new WalletV5R1Id({
            subwalletNumber: walletId,
        });
    }

    readonly subwalletNumber: number;

    readonly serialized: bigint;

    constructor(args?: { subwalletNumber?: number }) {
        this.subwalletNumber = args?.subwalletNumber ?? 0;
        this.serialized = BigInt(this.subwalletNumber);
    }
}

export class WalletV5 implements Contract {
    private subwalletId: number | undefined;
    public domain?: SignatureDomain;

    constructor(
        readonly client: ApiClient,
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
        domain?: SignatureDomain,
    ) {
        this.domain = domain;
    }

    static createFromAddress(client: ApiClient, address: Address, domain?: SignatureDomain) {
        return new WalletV5(client, address, undefined, domain);
    }

    static createFromConfig(config: WalletV5Config, options: WalletV5Options) {
        const data = walletV5ConfigToCell(config);
        const init = { code: options.code, data };
        const wallet = new WalletV5(options.client, contractAddress(options.workchain, init), init, options.domain);
        wallet.subwalletId = config.walletId;
        return wallet;
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendInternalSignedMessage(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            body: Cell;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeSlice(opts.body.beginParse()).endCell(),
        });
    }

    async sendInternalMessageFromExtension(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            body: Cell;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.auth_extension, 32)
                .storeUint(0, 64) // query id
                .storeSlice(opts.body.beginParse())
                .endCell(),
        });
    }

    async sendInternal(provider: ContractProvider, via: Sender, opts: Parameters<ContractProvider['internal']>[1]) {
        await provider.internal(via, opts);
    }

    async sendExternalSignedMessage(provider: ContractProvider, body: Cell) {
        await provider.external(body);
    }

    async sendExternal(provider: ContractProvider, body: Cell) {
        await provider.external(body);
    }

    get publicKey(): Promise<bigint> {
        return this.client.runGetMethod(asAddressFriendly(this.address), 'get_public_key').then((data) => {
            if (data.exitCode === 0) {
                const parsedStack = ParseStack(data.stack);
                if (parsedStack[0]?.type === 'int') {
                    return parsedStack[0].value;
                } else {
                    throw new Error('Stack is not an int');
                }
            } else if (this.init) {
                return this.init.data
                    .asSlice()
                    .skip(1 + 32 + 32)
                    .loadUintBig(256);
            } else {
                return 0n;
            }
        });
    }

    get status(): Promise<AccountStatus> {
        return this.client.getAccountState(asAddressFriendly(this.address)).then((state) => state.status);
    }

    get seqno() {
        return this.client.runGetMethod(asAddressFriendly(this.address), 'seqno').then((data) => {
            if (data.exitCode === 0) {
                const parsedStack = ParseStack(data.stack);
                if (parsedStack[0]?.type === 'int') {
                    return Number(parsedStack[0].value);
                } else {
                    throw new Error('Stack is not an int');
                }
            } else {
                return 0;
            }
        });
    }

    get isSignatureAuthAllowed(): Promise<boolean> {
        return this.client.runGetMethod(asAddressFriendly(this.address), 'is_signature_allowed').then((data) => {
            if (data.exitCode === 0) {
                const parsedStack = ParseStack(data.stack);
                if (parsedStack[0]?.type === 'int') {
                    return Boolean(parsedStack[0].value);
                } else {
                    throw new Error('Stack is not an int');
                }
            } else {
                return false;
            }
        });
    }

    get walletId(): Promise<WalletV5R1Id> {
        if (this.subwalletId !== undefined) {
            return new Promise((resolve) => {
                resolve(WalletV5R1Id.deserialize(this.subwalletId!));
            });
        } else {
            return this.client.runGetMethod(asAddressFriendly(this.address), 'get_subwallet_id').then((data) => {
                if (data.exitCode === 0) {
                    const parsedStack = ParseStack(data.stack);
                    if (parsedStack[0]?.type === 'int') {
                        this.subwalletId = Number(parsedStack[0].value);
                    } else {
                        throw new Error('Stack is not an int');
                    }
                    return WalletV5R1Id.deserialize(this.subwalletId);
                } else {
                    return WalletV5R1Id.deserialize(defaultWalletIdV5R1);
                }
            });
        }
    }

    // get extensions(): Promise<Address[]> {
    //     return this.client.runGetMethod(this.address, 'get_extensions').then((data) => {
    //         if (data.exitCode === 0) {
    //             const dict: Dictionary<bigint, bigint> = Dictionary.loadDirect(
    //                 Dictionary.Keys.BigUint(256),
    //                 Dictionary.Values.BigInt(1),
    //                 data.stack.readCellOpt(),
    //             );
    //             const wc = this.address.workChain;
    //             return dict.keys().map((key) => {
    //                 return Address.parseRaw(`${wc}:${key.toString(16).padStart(64, '0')}`);
    //             });
    //         } else {
    //             return [];
    //         }
    //     });
    // }
}
