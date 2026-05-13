/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * {@link CryptoOnrampProvider} implementation backed by Layerswap. Use {@link createLayerswapProvider} to register it on AppKit.
 *
 * @extract
 * @public
 * @category Class
 * @section Crypto Onramp
 */
export { LayerswapCryptoOnrampProvider } from '@ton/walletkit/crypto-onramp/layerswap';

/**
 * Build a Layerswap-backed {@link CryptoOnrampProvider} for AppKit. Pass the result to {@link AppKitConfig}'s `providers` or {@link registerProvider}.
 *
 * @extract
 * @public
 * @category Action
 * @section Crypto Onramp
 */
export { createLayerswapProvider } from '@ton/walletkit/crypto-onramp/layerswap';

/**
 * Configuration accepted by {@link createLayerswapProvider}.
 *
 * @extract
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type { LayerswapProviderConfig } from '@ton/walletkit/crypto-onramp/layerswap';

/**
 * Provider-specific metadata returned on a {@link CryptoOnrampQuote}'s `metadata` from Layerswap — carries the swap id and deposit action that {@link createCryptoOnrampDeposit} reads to build the deposit.
 *
 * @extract
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type { LayerswapQuoteMetadata } from '@ton/walletkit/crypto-onramp/layerswap';

// Internal Layerswap response shapes — re-exported for compatibility but not surfaced in the documented reference.
export type {
    LayerswapToken,
    LayerswapNetwork,
    LayerswapDepositAction,
    LayerswapSwap,
    LayerswapSwapStatus,
    LayerswapQuote,
    LayerswapSwapData,
    LayerswapCreateSwapResponse,
    LayerswapGetSwapResponse,
    LayerswapErrorResponse,
} from '@ton/walletkit/crypto-onramp/layerswap';
