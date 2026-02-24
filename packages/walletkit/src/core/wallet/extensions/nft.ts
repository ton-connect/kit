/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    createNftTransferPayload,
    createNftTransferRawPayload,
    createTransferTransaction,
    DEFAULT_NFT_GAS_FEE,
    storeNftTransferMessage,
} from '../../../utils/messageBuilders';
import { getNftFromClient, getNftsFromClient } from '../../../utils/assetHelpers';
import type { NftTransferMessage } from '../../../utils/messageBuilders';
import type { Wallet, WalletNftInterface } from '../../../api/interfaces';
import type {
    NFT,
    NFTRawTransferRequest,
    NFTsRequest,
    NFTsResponse,
    NFTTransferRequest,
    TransactionRequest,
    UserFriendlyAddress,
} from '../../../api/models';

// Re-export for backwards compatibility
export { storeNftTransferMessage };
export type { NftTransferMessage };

export class WalletNftClass implements WalletNftInterface {
    async getNfts(this: Wallet, params: NFTsRequest): Promise<NFTsResponse> {
        return getNftsFromClient(await this.getClient(), await this.getAddress(), params);
    }

    async getNft(this: Wallet, address: UserFriendlyAddress): Promise<NFT | null> {
        return getNftFromClient(await this.getClient(), address);
    }

    async createTransferNftTransaction(this: Wallet, params: NFTTransferRequest): Promise<TransactionRequest> {
        const nftPayload = createNftTransferPayload({
            newOwner: params.recipientAddress,
            responseDestination: await this.getAddress(),
            comment: params.comment,
        });

        return createTransferTransaction({
            targetAddress: params.nftAddress,
            amount: params.transferAmount?.toString() ?? DEFAULT_NFT_GAS_FEE,
            payload: nftPayload,
            fromAddress: await this.getAddress(),
        });
    }

    async createTransferNftRawTransaction(this: Wallet, params: NFTRawTransferRequest): Promise<TransactionRequest> {
        const nftPayload = createNftTransferRawPayload({
            queryId: params.message.queryId,
            newOwner: params.message.newOwner,
            responseDestination: params.message.responseDestination,
            customPayload: params.message.customPayload,
            forwardAmount: params.message.forwardAmount,
            forwardPayload: params.message.forwardPayload,
        });

        return createTransferTransaction({
            targetAddress: params.nftAddress,
            amount: params.transferAmount.toString(),
            payload: nftPayload,
            fromAddress: await this.getAddress(),
        });
    }
}
