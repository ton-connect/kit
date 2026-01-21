/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TonConnectUI } from '@ton/appkit-ui';

import { TonConnectProviderNotSetError } from '../errors/ton-connect-provider-not-set.error';

export function checkProvider(provider: TonConnectUI | null): provider is TonConnectUI {
    if (!provider) {
        throw new TonConnectProviderNotSetError(
            'You should add <TonConnectUIProvider> on the top of the app to use TonConnect',
        );
    }

    return true;
}
