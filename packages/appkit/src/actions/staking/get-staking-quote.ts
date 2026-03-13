/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StakingQuote, StakingQuoteParams } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';
import { resolveNetwork } from '../../utils';

export type GetStakingQuoteOptions = StakingQuoteParams & {
    providerId?: string;
};

export type GetStakingQuoteReturnType = Promise<StakingQuote>;

/**
 * Get staking quote
 */
export const getStakingQuote = async (appKit: AppKit, options: GetStakingQuoteOptions): GetStakingQuoteReturnType => {
    const optionsWithNetwork = {
        ...options,
        network: resolveNetwork(appKit, options.network),
    };

    return appKit.stakingManager.getQuote(optionsWithNetwork, options.providerId);
};
