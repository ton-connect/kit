/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// `DefiError` is shared by swap and staking; it is exported via `./swap` to keep a single declaration.

/**
 * @extract
 * @public
 * @category Class
 * @section Staking
 */
export { StakingProvider, StakingError, StakingManager } from '@ton/walletkit';

// `StakingErrorCode` is a TS enum; not currently surfaced in the reference (the generator does not yet handle enum declarations).
export { StakingErrorCode } from '@ton/walletkit';

/**
 * @extract
 * @public
 * @category Constants
 * @section Staking
 */
export { UnstakeMode } from '@ton/walletkit';

/**
 * @extract
 * @public
 * @category Type
 * @section Staking
 */
export type {
    UnstakeModes,
    StakeParams,
    StakingAPI,
    StakingQuote,
    StakingQuoteParams,
    StakingBalance,
    StakingProviderInfo,
    StakingQuoteDirection,
    StakingProviderMetadata,
    StakingTokenInfo,
} from '@ton/walletkit';

// Internal-only — `StakingProviderInterface` is the contract authors implement, not consumed from `@ton/appkit`.
export type { StakingProviderInterface } from '@ton/walletkit';
