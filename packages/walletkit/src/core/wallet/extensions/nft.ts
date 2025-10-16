import { NftTransferMessage, storeNftTransferMessage } from '@ton-community/assets-sdk';
import { Address, beginCell, Cell, SendMode } from '@ton/core';

import { IWallet } from '../../../types';
import { WalletNftInterface } from '../../../types/wallet';
import { validateTransactionMessage } from '../../../validation';
import { NftTransferParamsHuman, NftTransferParamsRaw } from '../../../types/nfts';
import { ConnectTransactionParamContent, ConnectTransactionParamMessage } from '../../../types/internal';
import type { NftItem } from '../../../types/toncenter/NftItem';
import { NftItems } from '../../../types/toncenter/NftItems';
import { LimitRequest } from '../../../types/toncenter/ApiClient';

export class WalletNftClass implements WalletNftInterface {
    async getNfts(this: IWallet, params: LimitRequest): Promise<NftItems> {
        const out = await this.client.nftItemsByOwner({
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
        const result = await this.client.nftItemsByAddress({
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

        if (!validateTransactionMessage(message, false).isValid) {
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

        if (!validateTransactionMessage(message, false).isValid) {
            throw new Error(`Invalid transaction message: ${JSON.stringify(message)}`);
        }

        return {
            messages: [message],
            from: this.getAddress(),
        };
    }
}
