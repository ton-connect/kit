/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Base error thrown across all DeFi domains (swap, staking, onramp, crypto-onramp). Subclassed by {@link SwapError}, {@link StakingError}, `OnrampError`, {@link CryptoOnrampError} — catch the base when you don't care which domain produced the failure.
 *
 * @extract
 * @public
 * @category Class
 * @section DeFi
 */
export { DefiError } from '@ton/walletkit';

/**
 * Error thrown by {@link SwapManager} and swap providers — extends {@link DefiError} with a `'swap'` discriminator.
 *
 * @extract
 * @public
 * @category Class
 * @section Swap
 */
export { SwapError } from '@ton/walletkit';

/**
 * Abstract base class implemented by swap providers (DeDust, Omniston, custom integrations); apps don't use it directly — they consume providers through {@link SwapManager} and the `getSwap*` / `buildSwapTransaction` actions.
 *
 * @extract
 * @public
 * @category Class
 * @section Swap
 */
export { SwapProvider } from '@ton/walletkit';

/**
 * Runtime that owns registered {@link SwapProvider}s and dispatches quote/swap calls. Exposed as {@link AppKit}`.swapManager`; usually accessed through the higher-level actions ({@link getSwapQuote}, {@link buildSwapTransaction}).
 *
 * @extract
 * @public
 * @category Class
 * @section Swap
 */
export { SwapManager } from '@ton/walletkit';

/**
 * Shape every DeFi domain manager (swap, staking, onramp, crypto-onramp) satisfies — provider registration, default-provider selection and lookups; mostly relevant when authoring a new domain manager.
 *
 * @extract
 * @public
 * @category Type
 * @section DeFi
 */
export type { DefiManagerAPI } from '@ton/walletkit';

/**
 * Base interface implemented by every {@link DefiProvider} (swap, staking, onramp, crypto-onramp) — exposes `providerId`, `type` and `getSupportedNetworks`. Domain-specific provider interfaces extend this with quote/build/status methods.
 *
 * @extract
 * @public
 * @category Type
 * @section DeFi
 */
export type { DefiProvider } from '@ton/walletkit';

/**
 * Discriminator that tags every {@link DefiProvider} with its kind — `'swap'`, `'staking'`, `'onramp'`, or `'crypto-onramp'`; used by {@link registerProvider} to dispatch to the right manager.
 *
 * @extract
 * @public
 * @category Type
 * @section DeFi
 */
export type { DefiProviderType } from '@ton/walletkit';

/**
 * Token entry returned by {@link SwapProvider}`.getSupportedTokens` — address, decimals, image, symbol; consumed by swap-input UIs to render the source/target token list.
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
 * API surface exposed by {@link SwapManager} — quote, build-transaction and supported-token reads. Mostly relevant when authoring a swap manager replacement.
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
 * Parameters consumed by {@link getSwapQuote} — source/target token addresses, an amount in either source or target units (`isSourceAmount` flag), optional slippage and provider-specific options.
 *
 * @extract
 * @public
 * @category Type
 * @section Swap
 */
export type { SwapQuoteParams } from '@ton/walletkit';

// Internal-only — `SwapProviderInterface` is the contract authors implement, not consumed from `@ton/appkit`.
export type { SwapProviderInterface } from '@ton/walletkit';
