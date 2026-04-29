/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CustomProvider } from '@ton/appkit';
import { TacSdk } from '@tonappchain/sdk';
import type { SDKParams } from '@tonappchain/sdk';

export interface TacProvider extends CustomProvider {
    readonly providerId: 'tac';
    readonly type: 'custom';
    readonly sdk: Promise<TacSdk>;
}

export const createTacProvider = (params: SDKParams): TacProvider => ({
    providerId: 'tac',
    type: 'custom',
    sdk: TacSdk.create(params),
});
