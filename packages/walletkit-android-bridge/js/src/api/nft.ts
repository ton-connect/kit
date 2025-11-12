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
export async function getNfts(args: GetNftsArgs) {
    return callBridge('getNfts', async () => {
        const limit = args.limit && args.limit > 0 ? args.limit : 100;
        const offset = args.offset && args.offset >= 0 ? args.offset : 0;
        return await callOnWalletBridge(args.address, 'getNfts', { limit, offset });
    });
}

/**
 * Fetches details for a single NFT by address.
 */
export async function getNft(args: GetNftArgs) {
    return callBridge('getNft', async () => {
        return await callOnWalletBridge(args.address, 'getNft');
    });
}

/**
 * Builds an NFT transfer transaction (human-readable parameters).
 */
export async function createTransferNftTransaction(args: CreateTransferNftTransactionArgs) {
    return callBridge('createTransferNftTransaction', async () => {
        const params = {
            nftAddress: args.nftAddress,
            toAddress: args.toAddress,
            transferAmount: args.transferAmount,
            comment: args.comment,
        };

        return await callOnWalletBridge(args.address, 'createTransferNftTransaction', params);
    });
}

/**
 * Builds an NFT transfer transaction (raw message parameters).
 */
export async function createTransferNftRawTransaction(args: CreateTransferNftRawTransactionArgs) {
    return callBridge('createTransferNftRawTransaction', async () => {
        const params = {
            nftAddress: args.nftAddress,
            transferAmount: args.transferAmount,
            transferMessage: args.transferMessage,
        };

        return await callOnWalletBridge(args.address, 'createTransferNftRawTransaction', params);
    });
}
