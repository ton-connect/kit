/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// `DefiError` is shared by swap and staking; it is exported via `./swap` to keep a single declaration.

/**
 * Abstract base class implemented by staking providers (Tonstakers, custom integrations, …); apps don't use it directly — they consume providers through {@link StakingManager} and the `getStaking*` / `buildStakeTransaction` actions.
 *
 * @extract
 * @public
 * @category Class
 * @section Staking
 */
export { StakingProvider } from '@ton/walletkit';

/**
 * Error thrown by {@link StakingManager} and staking providers — extends {@link DefiError} with a `'staking'` discriminator and a {@link StakingErrorCode} on `code`.
 *
 * @extract
 * @public
 * @category Class
 * @section Staking
 */
export { StakingError } from '@ton/walletkit';

/**
 * Runtime that owns registered {@link StakingProvider}s and dispatches quote/stake/balance calls. Exposed as {@link AppKit}`.stakingManager`; usually accessed through the higher-level actions ({@link getStakingQuote}, {@link buildStakeTransaction}, {@link getStakedBalance}).
 *
 * @extract
 * @public
 * @category Class
 * @section Staking
 */
export { StakingManager } from '@ton/walletkit';

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
 * Allowed unstake-timing flavours referenced by {@link UnstakeModes} and {@link StakingProviderInfo} — `'INSTANT'` (immediate withdrawal at a discount), `'WHEN_AVAILABLE'` (paid out as the pool unlocks), `'ROUND_END'` (paid out at the end of the staking round).
 *
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
} from '@ton/walletkit';

/**
 * Display metadata for a token a staking provider supports — name, symbol, image and optional address; carried on {@link StakingProviderInfo}`.tokens` so the UI can render the pool's input/output assets.
 *
 * @extract
 * @public
 * @category Type
 * @section Staking
 */
export type { StakingTokenInfo } from '@ton/walletkit';

// Internal-only — `StakingProviderInterface` is the contract authors implement, not consumed from `@ton/appkit`.
export type { StakingProviderInterface } from '@ton/walletkit';
