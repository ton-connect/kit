/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address, beginCell } from '@ton/core';

import { isValidAddress, asAddressFriendly } from './address';
import { ParseStack, SerializeStack } from './tvmStack';
import type { ApiClient } from '../types/toncenter/ApiClient';
import type {
    JettonsRequest,
    JettonsResponse,
    NFT,
    NFTsRequest,
    NFTsResponse,
    TokenAmount,
    UserFriendlyAddress,
} from '../api/models';

// ==========================================
// Jetton Helpers
// ==========================================

/**
 * Gets the jetton wallet address for an owner
 */
export async function getJettonWalletAddressFromClient(
    client: ApiClient,
    jettonAddress: UserFriendlyAddress,
    ownerAddress: UserFriendlyAddress,
): Promise<UserFriendlyAddress> {
    if (!isValidAddress(jettonAddress)) {
        throw new Error(`Invalid jetton address: ${jettonAddress}`);
    }

    try {
        const result = await client.runGetMethod(
            jettonAddress,
            'get_wallet_address',
            SerializeStack([{ type: 'slice', cell: beginCell().storeAddress(Address.parse(ownerAddress)).endCell() }]),
        );

        const parsedStack = ParseStack(result.stack);
        const jettonWalletAddress =
            parsedStack[0].type === 'slice' || parsedStack[0].type === 'cell'
                ? parsedStack[0].cell.asSlice().loadAddress()
                : null;

        if (!jettonWalletAddress) {
            throw new Error('Failed to get jetton wallet address');
        }

        return asAddressFriendly(jettonWalletAddress.toString());
    } catch (error) {
        throw new Error(
            `Failed to get jetton wallet address for ${jettonAddress}: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`,
        );
    }
}

/**
 * Gets the jetton balance for an owner's jetton wallet
 */
export async function getJettonBalanceFromClient(
    client: ApiClient,
    jettonWalletAddress: UserFriendlyAddress,
): Promise<TokenAmount> {
    try {
        const result = await client.runGetMethod(jettonWalletAddress, 'get_wallet_data');
        const parsedStack = ParseStack(result.stack);
        const balance = parsedStack[0].type === 'int' ? parsedStack[0].value : 0n;
        return balance.toString();
    } catch (_error) {
        return '0';
    }
}

/**
 * Gets jettons owned by an address
 */
export async function getJettonsFromClient(
    client: ApiClient,
    ownerAddress: UserFriendlyAddress,
    params?: JettonsRequest,
): Promise<JettonsResponse> {
    return client.jettonsByOwnerAddress({
        ownerAddress,
        offset: params?.pagination.offset,
        limit: params?.pagination.limit,
    });
}

// ==========================================
// NFT Helpers
// ==========================================

/**
 * Gets NFTs owned by an address
 */
export async function getNftsFromClient(
    client: ApiClient,
    ownerAddress: UserFriendlyAddress,
    params: NFTsRequest,
): Promise<NFTsResponse> {
    return client.nftItemsByOwner({
        ownerAddress,
        pagination: params.pagination,
    });
}

/**
 * Gets a single NFT by address
 */
export async function getNftFromClient(client: ApiClient, address: UserFriendlyAddress): Promise<NFT | null> {
    const result = await client.nftItemsByAddress({ address });
    return result.nfts.length > 0 ? result.nfts[0] : null;
}
