/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * nft.ts – NFT operations
 *
 * Simplified bridge for NFT listing and transfer transactions.
 */

import type { NFT, NFTsResponse, TransactionRequest, TransactionEmulatedPreview } from '@ton/walletkit';

import type {
    GetNftsArgs,
    GetNftArgs,
    CreateTransferNftTransactionArgs,
    CreateTransferNftRawTransactionArgs,
} from '../types';
import { callBridge, callOnWalletBridge } from '../utils/bridgeWrapper';

/**
 * Fetches NFTs owned by a wallet with optional pagination.
 */
export async function getNfts(args: GetNftsArgs): Promise<NFTsResponse> {
    return callBridge('getNfts', async () => {
        return await callOnWalletBridge<NFTsResponse>(args.walletId, 'getNfts', {
            pagination: args.pagination,
            collectionAddress: args.collectionAddress,
            indirectOwnership: args.indirectOwnership,
        });
    });
}

/**
 * Fetches details for a single NFT by address.
 */
export async function getNft(args: GetNftArgs): Promise<NFT | null> {
    return callBridge('getNft', async () => {
        return await callOnWalletBridge<NFT | null>(args.walletId, 'getNft', args.nftAddress);
    });
}

type NftTransactionResult = { transaction: TransactionRequest; preview?: TransactionEmulatedPreview };

/**
 * Builds an NFT transfer transaction (human-readable parameters).
 */
export async function createTransferNftTransaction(
    args: CreateTransferNftTransactionArgs,
): Promise<NftTransactionResult> {
    return callBridge('createTransferNftTransaction', async () => {
        return await callOnWalletBridge<NftTransactionResult>(args.walletId, 'createTransferNftTransaction', {
            nftAddress: args.nftAddress,
            toAddress: args.toAddress,
            transferAmount: args.transferAmount,
            comment: args.comment,
        });
    });
}

/**
 * Builds an NFT transfer transaction (raw message parameters).
 */
export async function createTransferNftRawTransaction(
    args: CreateTransferNftRawTransactionArgs,
): Promise<NftTransactionResult> {
    return callBridge('createTransferNftRawTransaction', async () => {
        return await callOnWalletBridge<NftTransactionResult>(args.walletId, 'createTransferNftRawTransaction', {
            nftAddress: args.nftAddress,
            transferAmount: args.transferAmount,
            transferMessage: args.transferMessage,
        });
    });
}
