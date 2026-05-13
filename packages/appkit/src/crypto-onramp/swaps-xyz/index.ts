/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * {@link CryptoOnrampProvider} implementation backed by swaps.xyz. Use {@link createSwapsXyzProvider} to register it on AppKit.
 *
 * @extract
 * @public
 * @category Class
 * @section Crypto Onramp
 */
export { SwapsXyzCryptoOnrampProvider } from '@ton/walletkit/crypto-onramp/swaps-xyz';

/**
 * Build a swaps.xyz-backed {@link CryptoOnrampProvider} for AppKit. Pass the result to {@link AppKitConfig}'s `providers` or {@link registerProvider}.
 *
 * @extract
 * @public
 * @category Action
 * @section Crypto Onramp
 */
export { createSwapsXyzProvider } from '@ton/walletkit/crypto-onramp/swaps-xyz';

/**
 * Configuration accepted by {@link createSwapsXyzProvider}.
 *
 * @extract
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type { SwapsXyzProviderConfig } from '@ton/walletkit/crypto-onramp/swaps-xyz';

/**
 * swaps.xyz-specific options forwarded through `providerOptions` on {@link CryptoOnrampQuoteParams}.
 *
 * @extract
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type { SwapsXyzQuoteOptions } from '@ton/walletkit/crypto-onramp/swaps-xyz';

/**
 * Provider-specific metadata returned on a {@link CryptoOnrampQuote}'s `metadata` from swaps.xyz — carries the resolved action and bridge route that {@link createCryptoOnrampDeposit} needs.
 *
 * @extract
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type { SwapsXyzQuoteMetadata } from '@ton/walletkit/crypto-onramp/swaps-xyz';

// Internal swaps.xyz response shapes — re-exported for compatibility but not surfaced in the documented reference.
export type {
    SwapsXyzVmId,
    SwapsXyzSwapDirection,
    SwapsXyzPayment,
    SwapsXyzEvmTx,
    SwapsXyzBridgeRouteStep,
    SwapsXyzGetActionResponse,
    SwapsXyzErrorResponse,
} from '@ton/walletkit/crypto-onramp/swaps-xyz';
