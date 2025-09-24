import { storeNftTransferMessage } from '@ton-community/assets-sdk';
import { Address, beginCell, SendMode } from '@ton/core';

import { WalletInterface } from '../../../types';
import { WalletNftInterface } from '../../../types/wallet';
import { validateTransactionMessage } from '../../../validation';
import { NftTransferParamsHuman, NftTransferParamsRaw } from '../../../types/nfts';
import { ConnectTransactionParamContent, ConnectTransactionParamMessage } from '../../../types/internal';
import type { NftItem } from '../../../types/toncenter/NftItem';
import { NftItems } from '../../../types/toncenter/NftItems';
import { LimitRequest } from '../../../types/toncenter/ApiClient';

export class WalletNftClass implements WalletNftInterface {
    async getNfts(this: WalletInterface, params: LimitRequest): Promise<NftItems> {
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

    async getNft(this: WalletInterface, address: Address | string): Promise<NftItem | null> {
        const result = await this.client.nftItemsByAddress({
            address: [address],
        });
        if (result.items.length > 0) {
            return result.items[0];
        }
        return null;
    }

    async createTransferNftTransaction(
        this: WalletInterface,
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
        this: WalletInterface,
        params: NftTransferParamsRaw,
    ): Promise<ConnectTransactionParamContent> {
        const nftPayload = beginCell().store(storeNftTransferMessage(params.transferMessage)).endCell();
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
