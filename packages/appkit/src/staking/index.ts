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

/**
 * Discriminator carried on every {@link StakingError}`.code` — `'INVALID_PARAMS'` (the request was malformed) or `'UNSUPPORTED_OPERATION'` (the provider doesn't support this call).
 *
 * @extract
 * @public
 * @category Constants
 * @section Staking
 */
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
