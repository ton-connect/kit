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
 * Provider configuration
 */
export type Provider = SwapProviderInterface | StakingProviderInterface;

/**
 * Either a ready-made DeFi/onramp provider instance or a factory that produces one — the value accepted by {@link AppKitConfig}`.providers` and {@link registerProvider}.
 *
 * @extract
 * @public
 * @category Type
 * @section DeFi
 */
export type { ProviderInput } from '@ton/walletkit';
