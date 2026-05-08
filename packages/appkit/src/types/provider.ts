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

export type { ProviderInput } from '@ton/walletkit';
