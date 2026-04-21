/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../core/Primitives';
import type { UnstakeModes } from './UnstakeMode';

export interface StakingTokenInfo {
    ticker: string;
    /** @format int */
    decimals: number;
    /** 'ton' for native TON, otherwise contract address in friendly format */
    address: string;
}

/**
 * Static metadata for a staking provider
 */
export interface StakingProviderMetadata {
    /** Supported unstake modes for this provider */
    supportedUnstakeModes: UnstakeModes[];

    /** Whether provider supports reversed quote format (e.g., passing TON instead of tsTON for unstake) */
    supportsReversedQuote: boolean;

    /** Token that the user sends when staking (e.g. TON) */
    stakeToken: StakingTokenInfo;

    /** Token that the user receives when staking (e.g. tsTON for liquid staking). Absent for direct/custodial staking. */
    receiveToken?: StakingTokenInfo;

    /** Provider contract address (optional — custodial providers may not have one) */
    contractAddress?: UserFriendlyAddress;
}

/**
 * Used in provider configuration to override fields of the provider's metadata.
 */
export interface StakingProviderMetadataOverride {
    stakeToken?: StakingTokenInfo;
    receiveToken?: StakingTokenInfo;
    contractAddress?: UserFriendlyAddress;
    supportedUnstakeModes?: UnstakeModes[];
    supportsReversedQuote?: boolean;
}
