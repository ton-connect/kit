/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OmnistonReferrerOptions } from './OmnistonReferrerOptions';
import type { OmnistonSwapOptions } from './OmnistonSwapOptions';

/**
 * Provider-specific options for Omniston swap operations
 */
export type OmnistonProviderOptions = OmnistonSwapOptions & OmnistonReferrerOptions;
