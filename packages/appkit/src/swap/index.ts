/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * @extract
 * @public
 * @category Class
 * @section DeFi
 */
export { DefiError } from '@ton/walletkit';

/**
 * @extract
 * @public
 * @category Class
 * @section Swap
 */
export { SwapError, SwapProvider, SwapManager } from '@ton/walletkit';

/**
 * @extract
 * @public
 * @category Type
 * @section DeFi
 */
export type { DefiManagerAPI, DefiProvider } from '@ton/walletkit';

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
 * @extract
 * @public
 * @category Type
 * @section Swap
 */
export type { SwapToken, SwapParams, SwapAPI, SwapQuote, SwapQuoteParams } from '@ton/walletkit';

// Internal-only — `SwapProviderInterface` is the contract authors implement, not consumed from `@ton/appkit`.
export type { SwapProviderInterface } from '@ton/walletkit';
