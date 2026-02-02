/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type TonStakersProviderConfig = {
    [key: string]: {
        contractAddress: string;
    };
};

export interface TonStakersPoolInfo {
    apy: number;
    tvl: bigint;
    instantLiquidity: bigint;
}
export type { PoolFullData } from './PoolContract';
