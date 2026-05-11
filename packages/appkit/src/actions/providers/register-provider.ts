/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { ProviderInput } from '../../types/provider';

/**
 * Provider instance or factory accepted by {@link registerProvider} — same shape used in {@link AppKitConfig}'s `providers`. AppKit dispatches it to the right manager based on `provider.type` (`'swap'`, `'staking'`, `'onramp'`, `'crypto-onramp'`).
 *
 * @public
 * @category Type
 * @section DeFi
 */
export type RegisterProviderOptions = ProviderInput;

/**
 * Register a DeFi / onramp provider at runtime — equivalent to passing it via {@link AppKitConfig}'s `providers` at construction, but available after AppKit is up. AppKit emits `provider:registered`, picked up by domain-specific subscribers like {@link watchSwapProviders} and {@link watchCryptoOnrampProviders}.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param provider - {@link RegisterProviderOptions} Provider instance or factory to register.
 *
 * @sample docs/examples/src/appkit/actions/providers#REGISTER_PROVIDER
 *
 * @public
 * @category Action
 * @section DeFi
 */
export const registerProvider = (appKit: AppKit, provider: RegisterProviderOptions): void => {
    appKit.registerProvider(provider);
};
