/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { WALLETS_EVENTS } from '@ton/appkit';

import { useAppKit } from './use-app-kit';

export const useConnectedWallets = () => {
    const appKit = useAppKit();

    const subscribe = useCallback(
        (callback: () => void) => {
            return appKit.eventBus.on(WALLETS_EVENTS.UPDATED, callback);
        },
        [appKit],
    );

    const getSnapshot = useCallback(() => {
        return appKit.getConnectedWallets();
    }, [appKit]);

    return useSyncExternalStore(subscribe, getSnapshot, () => []);
};
