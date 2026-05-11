/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * {@link SwapProvider} implementation backed by Omniston. Use {@link createOmnistonProvider} to register it on AppKit; quote and swap calls go through {@link getSwapQuote} / {@link buildSwapTransaction} like any other swap provider.
 *
 * @extract
 * @public
 * @category Class
 * @section Swap
 */
export { OmnistonSwapProvider } from '@ton/walletkit/swap/omniston';

/**
 * Build an Omniston-backed {@link SwapProvider} for AppKit; pass the result to {@link AppKitConfig}'s `providers` or {@link registerProvider}.
 *
 * @extract
 * @public
 * @category Action
 * @section Swap
 */
export { createOmnistonProvider } from '@ton/walletkit/swap/omniston';

/**
 * Configuration accepted by {@link createOmnistonProvider}.
 *
 * @extract
 * @public
 * @category Type
 * @section Swap
 */
export type { OmnistonSwapProviderConfig } from '@ton/walletkit/swap/omniston';

/**
 * Omniston-specific options forwarded through `providerOptions` on {@link SwapQuoteParams} / {@link SwapParams}.
 *
 * @extract
 * @public
 * @category Type
 * @section Swap
 */
export type { OmnistonProviderOptions } from '@ton/walletkit/swap/omniston';

/**
 * Optional referrer metadata attached to Omniston swaps so the provider can attribute them.
 *
 * @extract
 * @public
 * @category Type
 * @section Swap
 */
export type { OmnistonReferrerOptions } from '@ton/walletkit/swap/omniston';

/**
 * Provider-specific metadata returned on a {@link SwapQuote}'s `metadata` from Omniston — carries the resolved route and signed quote payload that {@link buildSwapTransaction} needs.
 *
 * @extract
 * @public
 * @category Type
 * @section Swap
 */
export type { OmnistonQuoteMetadata } from '@ton/walletkit/swap/omniston';
