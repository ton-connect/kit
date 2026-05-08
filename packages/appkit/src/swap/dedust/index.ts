/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * {@link SwapProvider} implementation backed by DeDust. Use {@link createDeDustProvider} to register it on AppKit; quote and swap calls go through {@link getSwapQuote} / {@link buildSwapTransaction} like any other swap provider.
 *
 * @extract
 * @public
 * @category Class
 * @section Swap
 */
export { DeDustSwapProvider } from '@ton/walletkit/swap/dedust';

/**
 * Build a DeDust-backed {@link SwapProvider} for AppKit; pass the result to {@link AppKitConfig}`.providers` or {@link registerProvider}.
 *
 * @extract
 * @public
 * @category Action
 * @section Swap
 */
export { createDeDustProvider } from '@ton/walletkit/swap/dedust';

/**
 * Configuration accepted by {@link createDeDustProvider}.
 *
 * @extract
 * @public
 * @category Type
 * @section Swap
 */
export type { DeDustSwapProviderConfig } from '@ton/walletkit/swap/dedust';

/**
 * DeDust-specific options forwarded through `providerOptions` on {@link SwapQuoteParams} / {@link SwapParams}.
 *
 * @extract
 * @public
 * @category Type
 * @section Swap
 */
export type { DeDustProviderOptions } from '@ton/walletkit/swap/dedust';

/**
 * Optional referral metadata attached to DeDust swaps so the provider can attribute them.
 *
 * @extract
 * @public
 * @category Type
 * @section Swap
 */
export type { DeDustReferralOptions } from '@ton/walletkit/swap/dedust';

/**
 * Provider-specific metadata returned on a {@link SwapQuote}`.metadata` from DeDust — carries the resolved route, fees and `swapData` payload that {@link buildSwapTransaction} needs.
 *
 * @extract
 * @public
 * @category Type
 * @section Swap
 */
export type { DeDustQuoteMetadata } from '@ton/walletkit/swap/dedust';

// Internal — type guard for DeDust quote metadata + walletkit response shapes; re-exported for compatibility but not surfaced in the documented reference.
export { isDeDustQuoteMetadata } from '@ton/walletkit/swap/dedust';
export type {
    DeDustQuoteResponse,
    DeDustRouteStep,
    DeDustSwapData,
    DeDustSwapResponse,
} from '@ton/walletkit/swap/dedust';
