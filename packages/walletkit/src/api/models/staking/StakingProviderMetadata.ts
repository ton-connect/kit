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
    /** Ticker symbol (e.g., `"TON"`, `"tsTON"`). */
    ticker: string;
    /**
     * Number of decimal places used to format raw amounts.
     * @format int
     */
    decimals: number;
    /** `'ton'` for native TON, otherwise the token contract address in user-friendly format. */
    address: string;
}

/**
 * Static metadata for a staking provider
 */
export interface StakingProviderMetadata {
    /** Human-readable provider name (e.g. "Tonstakers") */
    name: string;

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
 * Partial overrides applied on top of a provider's built-in {@link StakingProviderMetadata}. Used in provider configuration (e.g. `TonStakersChainConfig.metadata`) when an integrator needs to tweak the display name, token info or supported modes for a specific chain.
 */
export interface StakingProviderMetadataOverride {
    /** Override the human-readable provider name surfaced in UIs. */
    name?: string;
    /** Override the {@link StakingTokenInfo} of the token the user sends when staking. */
    stakeToken?: StakingTokenInfo;
    /** Override the {@link StakingTokenInfo} of the token the user receives when staking (e.g. liquid-staking receipt). */
    receiveToken?: StakingTokenInfo;
    /** Override the provider contract address (user-friendly format). */
    contractAddress?: UserFriendlyAddress;
    /** Override the list of supported unstake-timing modes. See {@link UnstakeMode}. */
    supportedUnstakeModes?: UnstakeModes[];
    /** Override whether the provider supports reversed-amount quotes (e.g., specifying TON instead of tsTON on an unstake quote). */
    supportsReversedQuote?: boolean;
}
