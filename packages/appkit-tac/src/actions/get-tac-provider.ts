/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getCustomProvider } from '@ton/appkit';
import type { AppKit } from '@ton/appkit';

import type { TacProvider } from '../provider/tac-provider';

export type GetTacProviderReturnType = TacProvider | undefined;

export const getTacProvider = (appKit: AppKit): GetTacProviderReturnType => {
    return getCustomProvider<TacProvider>(appKit, { id: 'tac' });
};
