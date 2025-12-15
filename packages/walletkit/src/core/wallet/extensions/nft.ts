/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address, beginCell, Builder, Cell, SendMode } from '@ton/core';

import { IWallet } from '../../../types';
import { WalletNftInterface } from '../../../types/wallet';
import { validateTransactionMessage } from '../../../validation';
import { NftTransferParamsHuman, NftTransferParamsRaw } from '../../../types/nfts';
import { ConnectTransactionParamContent, ConnectTransactionParamMessage } from '../../../types/internal';
import type { NftItem } from '../../../types/toncenter/NftItem';
import { NftItems } from '../../../types/toncenter/NftItems';
import { LimitRequest } from '../../../types/toncenter/ApiClient';

export const NFT_MINT_OPCODE = 1;
export const NFT_BATCH_MINT_OPCODE = 2;
export const NFT_CHANGE_ADMIN_OPCODE = 3;
export const NFT_CHANGE_CONTENT_OPCODE = 4;
export const NFT_TRANSFER_OPCODE = 0x5fcc3d14;
export const NFT_OWNER_ASSIGNED_OPCODE = 0x05138d91;
export const NFT_GET_STATIC_DATA_OPCODE = 0x2fcb26a2;
export const NFT_REPORT_STATIC_DATA_OPCODE = 0x8b771735;
export const NFT_EXCESSES_OPCODE = 0xd53276db;

// transfer query_id:uint64 new_owner:MsgAddress response_destination:MsgAddress custom_payload:(Maybe ^Cell)
//          forward_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell)  = InternalMsgBody;
export type NftTransferMessage = {
    queryId: bigint;
    newOwner: Address;
    responseDestination: Address | null;
    customPayload: Cell | null;
    forwardAmount: bigint;
    forwardPayload: Cell | null;
};

export function storeNftTransferMessage(message: NftTransferMessage): (builder: Builder) => void {
    return (builder) => {
        const { queryId, newOwner, responseDestination, customPayload, forwardAmount, forwardPayload } = message;
        builder
            .storeUint(NFT_TRANSFER_OPCODE, 32)
            .storeUint(queryId, 64)
            .storeAddress(newOwner)
            .storeAddress(responseDestination)
            .storeMaybeRef(customPayload)
            .storeCoins(forwardAmount)
            .storeMaybeRef(forwardPayload);
    };
}

export class WalletNftClass implements WalletNftInterface {
    async getNfts(this: IWallet, params: LimitRequest): Promise<NftItems> {
        const out = await this.getClient().nftItemsByOwner({
            ownerAddress: [this.getAddress()],
            offset: params.offset ?? 0,
            limit: params.limit ?? 100,
        });
        return {
            items: out.items,
            pagination: out.pagination,
        };
    }

    async getNft(this: IWallet, address: Address | string): Promise<NftItem | null> {
        const result = await this.getClient().nftItemsByAddress({
            address: [address],
        });
        if (result.items.length > 0) {
            return result.items[0];
        }
        return null;
    }

    async createTransferNftTransaction(
        this: IWallet,
        nftTransferMessage: NftTransferParamsHuman,
    ): Promise<ConnectTransactionParamContent> {
        const forwardPayload = nftTransferMessage.comment
            ? beginCell().storeUint(0, 32).storeStringTail(nftTransferMessage.comment).endCell()
            : null;
        const nftPayload = beginCell()
            .store(
                storeNftTransferMessage({
                    customPayload: null,
                    forwardAmount: 1n,
                    forwardPayload: forwardPayload,
                    newOwner: Address.parse(nftTransferMessage.toAddress),
                    queryId: 0n,
                    responseDestination: Address.parse(this.getAddress()),
                }),
            )
            .endCell();
        const message: ConnectTransactionParamMessage = {
            address: nftTransferMessage.nftAddress,
            amount: nftTransferMessage.transferAmount.toString(),
            payload: nftPayload.toBoc().toString('base64'),
            stateInit: undefined,
            extraCurrency: undefined,
            mode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
        };

        if (!(await validateTransactionMessage(message, false)).isValid) {
            throw new Error(`Invalid transaction message: ${JSON.stringify(message)}`);
        }

        return {
            messages: [message],
            from: this.getAddress(),
        };
    }

    async createTransferNftRawTransaction(
        this: IWallet,
        params: NftTransferParamsRaw,
    ): Promise<ConnectTransactionParamContent> {
        const transferMessage: NftTransferMessage = {
            queryId: BigInt(params.transferMessage.queryId),
            newOwner:
                typeof params.transferMessage.newOwner === 'string'
                    ? Address.parse(params.transferMessage.newOwner)
                    : params.transferMessage.newOwner,
            responseDestination: params.transferMessage.responseDestination
                ? typeof params.transferMessage.responseDestination === 'string'
                    ? Address.parse(params.transferMessage.responseDestination)
                    : params.transferMessage.responseDestination
                : null,
            customPayload: params.transferMessage.customPayload
                ? typeof params.transferMessage.customPayload === 'string'
                    ? Cell.fromBase64(params.transferMessage.customPayload)
                    : params.transferMessage.customPayload
                : null,
            forwardAmount: BigInt(params.transferMessage.forwardAmount),
            forwardPayload: params.transferMessage.forwardPayload
                ? typeof params.transferMessage.forwardPayload === 'string'
                    ? Cell.fromBase64(params.transferMessage.forwardPayload)
                    : params.transferMessage.forwardPayload
                : null,
        };
        const nftPayload = beginCell().store(storeNftTransferMessage(transferMessage)).endCell();
        const message: ConnectTransactionParamMessage = {
            address: params.nftAddress,
            amount: params.transferAmount.toString(),
            payload: nftPayload.toBoc().toString('base64'),
            stateInit: undefined,
            extraCurrency: undefined,
            mode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
        };

        if (!(await validateTransactionMessage(message, false)).isValid) {
            throw new Error(`Invalid transaction message: ${JSON.stringify(message)}`);
        }

        return {
            messages: [message],
            from: this.getAddress(),
        };
    }
}
