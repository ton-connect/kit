/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export { StakingProvider, UnstakeMode, StakingError, StakingErrorCode, StakingManager } from '@ton/walletkit';
// `DefiError` is shared by swap and staking; it is exported via `./swap` to keep a single declaration.

export type {
    UnstakeModes,
    StakeParams,
    StakingAPI,
    StakingQuote,
    StakingQuoteParams,
    StakingBalance,
    StakingProviderInfo,
    StakingProviderInterface,
    StakingQuoteDirection,
    StakingProviderMetadata,
    StakingTokenInfo,
} from '@ton/walletkit';
