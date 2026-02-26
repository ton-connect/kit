/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OmnistonReferrerOptions } from './OmnistonReferrerOptions';

export interface OmnistonSwapProviderConfig extends OmnistonReferrerOptions {
    apiUrl?: string;
    defaultSlippageBps?: number;
    quoteTimeoutMs?: number;
    providerId?: string;
}
