/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { getConnectors, watchConnectors } from '@ton/appkit';
import type { GetConnectorsReturnType } from '@ton/appkit';

import { useAppKit } from '../../settings';

/**
 * Return type of {@link useConnectors} — same shape as {@link appkit:GetConnectorsReturnType}.
 *
 * @public
 * @category Type
 * @section Connectors
 */
export type UseConnectorsReturnType = GetConnectorsReturnType;

/**
 * Read the list of connectors registered on this AppKit instance. Updates when a connector is registered or unregistered (use {@link useConnectedWallets} to react to wallet connect/disconnect events).
 *
 * @returns Read-only array of registered {@link appkit:Connector}s.
 *
 * @public
 * @category Hook
 * @section Connectors
 */
export const useConnectors = (): UseConnectorsReturnType => {
    const appKit = useAppKit();

    const subscribe = useCallback(
        (onChange: () => void) => {
            return watchConnectors(appKit, { onChange });
        },
        [appKit],
    );

    const getSnapshot = useCallback(() => {
        return getConnectors(appKit);
    }, [appKit]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
