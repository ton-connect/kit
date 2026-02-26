/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network } from '@ton/walletkit';

export type NetworkType = 'mainnet' | 'testnet' | 'tetra';

export function getChainNetwork(network: NetworkType): Network {
    switch (network) {
        case 'mainnet':
            return Network.mainnet();
        case 'tetra':
            return Network.tetra();
        default:
            return Network.testnet();
    }
}

export function getNetworkType(network: Network): NetworkType {
    if (network.chainId === Network.mainnet().chainId) {
        return 'mainnet';
    }
    if (network.chainId === Network.tetra().chainId) {
        return 'tetra';
    }
    return 'testnet';
}

export function getNetworkLabel(network: NetworkType): string {
    switch (network) {
        case 'mainnet':
            return 'Mainnet';
        case 'tetra':
            return 'Tetra';
        default:
            return 'Testnet';
    }
}
