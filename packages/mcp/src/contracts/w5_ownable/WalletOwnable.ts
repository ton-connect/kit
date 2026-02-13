/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Cell, Contract, Sender, ContractProvider, AccountStatus } from '@ton/core';
import type { Address } from '@ton/core';
import { beginCell, contractAddress, Dictionary, SendMode } from '@ton/core';
import type { ApiClient } from '@ton/walletkit';
import { ParseStack, formatWalletAddress } from '@ton/walletkit';

export interface WalletOptions {
    code: Cell;
    workchain: number;
    client: ApiClient;
}

export type NftItemStorageNotInitialized = {
    itemIndex: bigint;
    collectionAddress: Address;
};

export function nftItemStorageNotInitializedToCell(config: NftItemStorageNotInitialized): Cell {
    return beginCell().storeUint(config.itemIndex, 256).storeAddress(config.collectionAddress).endCell();
}

export type WalletOwnableConfig = {
    signatureAllowed: boolean;
    seqno: number;
    walletId: number;
    publicKey: bigint;
    extensions: Dictionary<bigint, boolean>;
    owner: Address;
    nftInfo: NftItemStorageNotInitialized;
};

export function walletOwnableStateInitToCell(config: WalletOwnableConfig): Cell {
    return beginCell()
        .storeBit(config.signatureAllowed)
        .storeUint(config.seqno, 32)
        .storeUint(config.walletId, 32)
        .storeUint(config.publicKey, 256)
        .storeDict(config.extensions, Dictionary.Keys.BigUint(256), Dictionary.Values.Bool())
        .storeAddress(config.owner)
        .storeRef(nftItemStorageNotInitializedToCell(config.nftInfo))
        .endCell();
}

export function walletOwnableConfigToCell(config: WalletOwnableConfig): Cell {
    return beginCell()
        .storeUint(config.nftInfo.itemIndex, 256)
        .storeAddress(config.nftInfo.collectionAddress)
        .endCell();
}

export const Opcodes = {
    // Out actions
    action_send_msg: 0x0ec3c86d,
    action_set_code: 0xad4de08e,
    action_extended_set_data: 0x1ff8ea0b,
    // Extra actions
    action_extended_add_extension: 0x02,
    action_extended_remove_extension: 0x03,
    action_extended_set_signature_auth_allowed: 0x04,
    // Auth/message types
    auth_extension: 0x6578746e,
    auth_signed: 0x7369676e,
    auth_signed_internal: 0x73696e74,
    // Owner messages
    internal_request_from_owner: 0x7361234e,
    // NFT transfer messages
    ask_to_change_ownership: 0x5fcc3d14,
    notification_for_new_owner: 0x05138d91,
    return_excesses_back: 0xd53276db,
};

export class WalletOwnableId {
    static deserialize(walletId: number): WalletOwnableId {
        return new WalletOwnableId({
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

// export interface NftData {
//     isInitialized: boolean;
//     itemIndex: bigint;
//     collectionAddress: Address;
//     ownerAddress?: Address;
//     content?: Cell;
// }

export class WalletOwnable implements Contract {
    private subwalletId: number | undefined;

    constructor(
        readonly client: ApiClient,
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(client: ApiClient, address: Address) {
        return new WalletOwnable(client, address);
    }

    static createFromConfig(config: WalletOwnableConfig, options: WalletOptions) {
        const data = walletOwnableConfigToCell(config);
        const init = { code: options.code, data };
        const wallet = new WalletOwnable(options.client, contractAddress(options.workchain, init), init);
        wallet.subwalletId = config.walletId;
        return wallet;
    }

    // async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    //     await provider.internal(via, {
    //         value,
    //         sendMode: SendMode.PAY_GAS_SEPARATELY,
    //         body: beginCell().endCell(),
    //     });
    // }

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
        return this.client.runGetMethod(formatWalletAddress(this.address), 'get_public_key').then((data) => {
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
        return this.client.getAccountState(formatWalletAddress(this.address)).then((state) => state.status);
    }

    get seqno() {
        return this.client.runGetMethod(formatWalletAddress(this.address), 'seqno').then((data) => {
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
        return this.client.runGetMethod(formatWalletAddress(this.address), 'is_signature_allowed').then((data) => {
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

    get walletId(): WalletOwnableId {
        return WalletOwnableId.deserialize(this.subwalletId!);
    }

    // get nftData(): Promise<NftData> {
    //     return this.client.runGetMethod(formatWalletAddress(this.address), 'get_nft_data').then((data) => {
    //         if (data.exitCode === 0) {
    //             const parsedStack = ParseStack(data.stack);
    //             // Stack: [isInitialized, itemIndex, collectionAddress, ownerAddress?, content?]
    //             const isInitialized = parsedStack[0]?.type === 'int' ? Boolean(parsedStack[0].value) : false;
    //             const itemIndex = parsedStack[1]?.type === 'int' ? parsedStack[1].value : 0n;
    //             const collectionAddress =
    //                 parsedStack[2]?.type === 'slice'
    //                     ? parsedStack[2].value.loadAddress()
    //                     : Address.parseRaw('0:0000000000000000000000000000000000000000000000000000000000000000');

    //             const result: NftData = {
    //                 isInitialized,
    //                 itemIndex,
    //                 collectionAddress,
    //             };

    //             if (isInitialized) {
    //                 if (parsedStack[3]?.type === 'slice') {
    //                     result.ownerAddress = parsedStack[3].value.loadAddress();
    //                 }
    //                 if (parsedStack[4]?.type === 'cell') {
    //                     result.content = parsedStack[4].value;
    //                 }
    //             }

    //             return result;
    //         } else {
    //             throw new Error('Failed to get NFT data');
    //         }
    //     });
    // }

    // get owner(): Promise<Address | null> {
    //     return this.nftData.then((data) => data.ownerAddress ?? null);
    // }
}
