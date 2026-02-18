/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { getConnectedWallets, watchConnectedWallets } from '@ton/appkit';
import type { GetConnectedWalletsReturnType } from '@ton/appkit';

import { useAppKit } from '../../../hooks/use-app-kit';

export type UseConnectedWalletsReturnType = GetConnectedWalletsReturnType;

export const useConnectedWallets = (): UseConnectedWalletsReturnType => {
    const appKit = useAppKit();

    const subscribe = useCallback(
        (onChange: () => void) => {
            return watchConnectedWallets(appKit, { onChange });
        },
        [appKit],
    );

    const getSnapshot = useCallback(() => {
        return getConnectedWallets(appKit);
    }, [appKit]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
