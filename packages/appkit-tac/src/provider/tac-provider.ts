/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CustomProvider } from '@ton/appkit';
import type { TacSdk } from '@tonappchain/sdk';

export interface TacProvider extends CustomProvider {
    readonly providerId: 'tac';
    readonly type: 'custom';
    readonly sdk: TacSdk;
}

export const createTacProvider = (sdk: TacSdk): TacProvider => ({
    providerId: 'tac',
    type: 'custom',
    sdk,
});
