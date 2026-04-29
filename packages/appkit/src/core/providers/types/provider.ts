/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SwapProviderInterface } from '../../../swap';
import type { StakingProviderInterface } from '../../../staking';
import type { CustomProvider } from './custom-provider';

export type Provider = SwapProviderInterface | StakingProviderInterface | CustomProvider;
