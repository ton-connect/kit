/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NFT } from '@ton/appkit';

/**
 * Mock NFT items representing agent sub-wallets.
 * In production these come from the on-chain NFT collection contract.
 */
export const MOCK_NFT_ITEMS: NFT[] = [
    {
        address: 'EQBvW8Z5huBkMJYdnfAEM5JqTNkuFX5diqRQIGuJmGwxU3Yp',
        index: '0',
        info: {
            name: 'DeDust Trader',
            description: 'Created by DeDust Bot',
        },
        attributes: [
            { traitType: 'operator_pubkey', value: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2' },
            { traitType: 'created_at', value: '2026-02-15T10:30:00Z' },
            { traitType: 'status', value: 'accepted' },
        ],
        collection: {
            address: 'EQAAgenticWalletsCollectionMockAddress000000000000',
            name: 'Agentic Wallets',
        },
        ownerAddress: '',
    },
    {
        address: 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2',
        index: '1',
        info: {
            name: 'NFT Sniper',
            description: 'Created by NFT Sniper Bot',
        },
        attributes: [
            { traitType: 'operator_pubkey', value: 'f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5' },
            { traitType: 'created_at', value: '2026-02-20T14:15:00Z' },
            { traitType: 'status', value: 'pending' },
        ],
        collection: {
            address: 'EQAAgenticWalletsCollectionMockAddress000000000000',
            name: 'Agentic Wallets',
        },
        ownerAddress: '',
    },
    {
        address: 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N',
        index: '2',
        info: {
            name: 'Rebalancer',
            description: 'Created by DeFi Rebalancer',
        },
        attributes: [
            { traitType: 'operator_pubkey', value: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' },
            { traitType: 'created_at', value: '2026-02-10T08:00:00Z' },
            { traitType: 'status', value: 'accepted' },
        ],
        collection: {
            address: 'EQAAgenticWalletsCollectionMockAddress000000000000',
            name: 'Agentic Wallets',
        },
        ownerAddress: '',
    },
];
