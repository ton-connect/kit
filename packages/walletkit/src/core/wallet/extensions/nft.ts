/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NftTransferMessage } from '@ton-community/assets-sdk';
import { storeNftTransferMessage } from '@ton-community/assets-sdk';
import { Address, beginCell, Cell } from '@ton/core';

import { validateTransactionMessage } from '../../../validation';
import type { Wallet, WalletNftInterface } from '../../../api/interfaces';
import type {
    Base64String,
    NFT,
    NFTRawTransferRequest,
    NFTsRequest,
    NFTsResponse,
    NFTTransferRequest,
    TransactionRequest,
    TransactionRequestMessage,
    UserFriendlyAddress,
} from '../../../api/models';
import { SendModeFlag } from '../../../api/models';

export class WalletNftClass implements WalletNftInterface {
    async getNfts(this: Wallet, params: NFTsRequest): Promise<NFTsResponse> {
        const out = await this.getClient().nftItemsByOwner({
            ownerAddress: this.getAddress(),
            pagination: params.pagination,
        });
        return out;
    }

    async getNft(this: Wallet, address: UserFriendlyAddress): Promise<NFT | null> {
        const result = await this.getClient().nftItemsByAddress({
            address: address,
        });
        if (result.nfts.length > 0) {
            return result.nfts[0];
        }
        return null;
    }

    async createTransferNftTransaction(
        this: Wallet,
        nftTransferMessage: NFTTransferRequest,
    ): Promise<TransactionRequest> {
        const forwardPayload = nftTransferMessage.comment
            ? beginCell().storeUint(0, 32).storeStringTail(nftTransferMessage.comment).endCell()
            : null;
        const nftPayload = beginCell()
            .store(
                storeNftTransferMessage({
                    customPayload: null,
                    forwardAmount: 1n,
                    forwardPayload: forwardPayload,
                    newOwner: Address.parse(nftTransferMessage.recipientAddress),
                    queryId: 0n,
                    responseDestination: Address.parse(this.getAddress()),
                }),
            )
            .endCell();
        const message: TransactionRequestMessage = {
            address: nftTransferMessage.nftAddress,
            amount: nftTransferMessage.transferAmount?.toString() ?? '100000000', // Default 0.1 TON
            payload: nftPayload.toBoc().toString('base64') as Base64String,
            stateInit: undefined,
            extraCurrency: undefined,
            mode: {
                flags: [SendModeFlag.IGNORE_ERRORS, SendModeFlag.PAY_GAS_SEPARATELY],
            },
        };

        if (!validateTransactionMessage(message, false).isValid) {
            throw new Error(`Invalid transaction message: ${JSON.stringify(message)}`);
        }

        return {
            messages: [message],
            fromAddress: this.getAddress(),
        };
    }

    async createTransferNftRawTransaction(this: Wallet, params: NFTRawTransferRequest): Promise<TransactionRequest> {
        const transferMessage: NftTransferMessage = {
            queryId: BigInt(params.message.queryId),
            newOwner:
                typeof params.message.newOwner === 'string'
                    ? Address.parse(params.message.newOwner)
                    : params.message.newOwner,
            responseDestination: params.message.responseDestination
                ? typeof params.message.responseDestination === 'string'
                    ? Address.parse(params.message.responseDestination)
                    : params.message.responseDestination
                : null,
            customPayload: params.message.customPayload
                ? typeof params.message.customPayload === 'string'
                    ? Cell.fromBase64(params.message.customPayload)
                    : params.message.customPayload
                : null,
            forwardAmount: BigInt(params.message.forwardAmount),
            forwardPayload: params.message.forwardPayload
                ? typeof params.message.forwardPayload === 'string'
                    ? Cell.fromBase64(params.message.forwardPayload)
                    : params.message.forwardPayload
                : null,
        };
        const nftPayload = beginCell().store(storeNftTransferMessage(transferMessage)).endCell();
        const message: TransactionRequestMessage = {
            address: params.nftAddress,
            amount: params.transferAmount.toString(),
            payload: nftPayload.toBoc().toString('base64') as Base64String,
            stateInit: undefined,
            extraCurrency: undefined,
            mode: {
                flags: [SendModeFlag.IGNORE_ERRORS, SendModeFlag.PAY_GAS_SEPARATELY],
            },
        };

        if (!validateTransactionMessage(message, false).isValid) {
            throw new Error(`Invalid transaction message: ${JSON.stringify(message)}`);
        }

        return {
            messages: [message],
            fromAddress: this.getAddress(),
        };
    }
}
