/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OnrampAmountPreset } from './types';

export const DEFAULT_ONRAMP_PRESETS: OnrampAmountPreset[] = [
    { amount: '100', label: '100' },
    { amount: '250', label: '250' },
    { amount: '500', label: '500' },
    { amount: '1000', label: '1000' },
];

export const NATIVE_TON_ADDRESS = '0x0000000000000000000000000000000000000000';

export const ERROR_THRESHOLD = 10000000;
