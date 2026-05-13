/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Base error thrown across all DeFi domains (swap, staking, onramp, crypto-onramp). Subclassed by {@link SwapError}, {@link StakingError}, {@link CryptoOnrampError} and the internal onramp error — catch the base when you don't care which domain produced the failure.
 *
 * Codes (`DefiError.*`):
 * - `'PROVIDER_NOT_FOUND'` — provider with the requested id is not registered with the manager.
 * - `'NO_DEFAULT_PROVIDER'` — no default provider is configured and the caller did not specify one.
 * - `'NETWORK_ERROR'` — provider rejected the request because of an upstream/network failure.
 * - `'UNSUPPORTED_NETWORK'` — provider does not support the network selected for the operation.
 * - `'INVALID_PARAMS'` — caller passed parameters that fail provider-level validation.
 * - `'INVALID_PROVIDER'` — provider failed its own internal validation and cannot be used.
 *
 * @extract
 * @public
 * @category Class
 * @section DeFi
 */
export { DefiError } from '@ton/walletkit';

/**
 * Error thrown by {@link SwapManager} and swap providers — extends {@link DefiError} with `name: 'SwapError'` and a stable `code` from the static `SwapError.*` / `DefiError.*` constants.
 *
 * Codes (`SwapError.*`, in addition to inherited {@link DefiError} codes):
 * - `'INVALID_QUOTE'` — provider returned malformed or missing quote data.
 * - `'INSUFFICIENT_LIQUIDITY'` — no route or pool has enough liquidity to satisfy the requested swap.
 * - `'QUOTE_EXPIRED'` — quote payload is too old to use. Fetch a new one before building the transaction.
 * - `'BUILD_TX_FAILED'` — provider failed to produce a swap transaction from the supplied quote.
 *
 * @extract
 * @public
 * @category Class
 * @section Swap
 */
export { SwapError } from '@ton/walletkit';

/**
 * Abstract base class implemented by swap providers (DeDust, Omniston, custom integrations). Apps don't use it directly — they consume providers through {@link SwapManager} and the `getSwap*` / `buildSwapTransaction` actions.
 *
 * @extract
 * @public
 * @category Class
 * @section Swap
 */
export { SwapProvider } from '@ton/walletkit';

/**
 * Runtime that owns registered {@link SwapProvider}s and dispatches quote/swap calls. Usually accessed through the higher-level actions ({@link getSwapQuote}, {@link buildSwapTransaction}).
 *
 * @extract
 * @public
 * @category Class
 * @section Swap
 */
export { SwapManager } from '@ton/walletkit';

/**
 * Shape every DeFi domain manager (swap, staking, onramp, crypto-onramp) satisfies — provider registration, default-provider selection and lookups. Mostly relevant when authoring a new domain manager.
 *
 * @extract
 * @public
 * @category Type
 * @section DeFi
 */
export type { DefiManagerAPI } from '@ton/walletkit';

/**
 * Base interface implemented by every DeFi provider (swap, staking, onramp, crypto-onramp) — exposes `providerId`, `type` and `getSupportedNetworks`. Domain-specific provider interfaces extend this with quote/build/status methods.
 *
 * @extract
 * @public
 * @category Type
 * @section DeFi
 */
export type { DefiProvider } from '@ton/walletkit';

/**
 * Discriminator that tags every {@link DefiProvider} with its kind — `'swap'`, `'staking'`, `'onramp'`, or `'crypto-onramp'`. Used by {@link registerProvider} to dispatch to the right manager.
 *
 * @extract
 * @public
 * @category Type
 * @section DeFi
 */
export type { DefiProviderType } from '@ton/walletkit';

/**
 * Token descriptor passed to {@link getSwapQuote} via {@link SwapQuoteParams}'s `from` and `to` fields (and surfaced on the resulting {@link SwapQuote}) — address, decimals plus optional symbol/name/image used by swap-input UIs.
 *
 * @extract
 * @public
 * @category Type
 * @section Swap
 */
export type { SwapToken } from '@ton/walletkit';

/**
 * Parameters consumed by {@link buildSwapTransaction} — the previously obtained {@link SwapQuote} plus optional provider-specific options (`TProviderOptions`).
 *
 * @extract
 * @public
 * @category Type
 * @section Swap
 */
export type { SwapParams } from '@ton/walletkit';

/**
 * API surface exposed by {@link SwapManager} — quote and build-transaction calls (plus the provider-management methods inherited from {@link DefiManagerAPI}). Mostly relevant when authoring a swap manager replacement.
 *
 * @extract
 * @public
 * @category Type
 * @section Swap
 */
export type { SwapAPI } from '@ton/walletkit';

/**
 * Quote returned by {@link getSwapQuote} — source/target tokens, expected amounts, rate, slippage, fees and the provider-specific `metadata` that {@link buildSwapTransaction} needs to construct the transaction.
 *
 * @extract
 * @public
 * @category Type
 * @section Swap
 */
export type { SwapQuote } from '@ton/walletkit';

/**
 * Parameters consumed by {@link getSwapQuote} — source/target tokens and an amount that is interpreted as either the spend side or the receive side (`isReverseSwap` flag), plus optional slippage and provider-specific options.
 *
 * @extract
 * @public
 * @category Type
 * @section Swap
 */
export type { SwapQuoteParams } from '@ton/walletkit';

// Internal-only — `SwapProviderInterface` is the contract authors implement, not consumed from `@ton/appkit`.
export type { SwapProviderInterface } from '@ton/walletkit';
