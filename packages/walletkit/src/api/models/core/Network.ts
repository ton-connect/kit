/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * TON blockchain network identifier.
 */
export interface Network {
    /**
     * Chain ID of the network (e.g., "-239" for mainnet, "-3" for testnet)
     */
    chainId: string;
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Network = {
    /**
     * TON Mainnet (chain ID: -239)
     */
    mainnet: (): Network => ({ chainId: '-239' }),

    /**
     * TON Testnet (chain ID: -3)
     */
    testnet: (): Network => ({ chainId: '-3' }),

    /**
     * TON Tetra L2 chain (chain ID: 662387)
     */
    tetra: (): Network => ({ chainId: '662387' }),

    /**
     * Custom network with specified chain ID
     */
    custom: (chainId: string): Network => ({ chainId }),
};
