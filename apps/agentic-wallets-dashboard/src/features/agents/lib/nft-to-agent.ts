/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NFT } from '@ton/appkit';
import type { Cell } from '@ton/core';

import type { AgentStatus, AgentWallet } from '../types';

function getAttribute(nft: NFT, traitType: string): string | undefined {
    return nft.attributes?.find((a) => a.traitType === traitType || (a as { trait_type?: string }).trait_type === traitType)
        ?.value;
}

function parseStatus(value: string | undefined): AgentStatus {
    if (value === 'active' || value === 'revoked') {
        return value;
    }
    return 'active';
}

export function nftToAgent(nft: NFT, nftItemContent: Cell | null = null): AgentWallet {
    const createdAt = getAttribute(nft, 'created_at') ?? new Date().toISOString();
    return {
        id: nft.address,
        name: nft.info?.name ?? `Agent #${nft.index ?? '?'}`,
        address: nft.address,
        operatorPubkey: getAttribute(nft, 'operator_pubkey') ?? '',
        originOperatorPublicKey: getAttribute(nft, 'origin_operator_public_key') ?? '',
        ownerAddress: nft.ownerAddress ?? '',
        createdAt,
        detectedAt: createdAt,
        isNew: false,
        status: parseStatus(getAttribute(nft, 'status')),
        source: nft.info?.description ?? nft.collection?.name ?? 'Unknown',
        collectionAddress: nft.collection?.address,
        nftItemContent,
    };
}

export function nftsToAgents(nfts: NFT[]): AgentWallet[] {
    return nfts.map((nft) => nftToAgent(nft));
}
