/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SwapProviderInterface } from '../swap';
import type { StakingProviderInterface } from '../staking';

/**
 * Internal union of registerable DeFi provider instances (swap or staking) — used to type provider-related collections inside AppKit.
 */
export type Provider = SwapProviderInterface | StakingProviderInterface;

/**
 * Either a ready-made DeFi/onramp provider instance or a factory that produces one — the value accepted by {@link AppKitConfig}'s `providers` and {@link registerProvider}.
 *
 * @extract
 * @public
 * @category Type
 * @section DeFi
 */
export type { ProviderInput } from '@ton/walletkit';

/**
 * Context that AppKit's DeFi managers inject into a {@link ProviderInput} factory at registration time — gives the provider access to AppKit's network manager and event emitter, plus an `ssr` flag for server-side initialisation.
 *
 * @extract
 * @public
 * @category Type
 * @section DeFi
 */
export type { ProviderFactoryContext } from '@ton/walletkit';
