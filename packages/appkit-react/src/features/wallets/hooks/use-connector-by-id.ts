/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { getConnectorById, watchConnectorById } from '@ton/appkit';
import type { Connector } from '@ton/appkit';

import { useAppKit } from '../../settings';

/**
 * Look up a connector by its id and stay subscribed to its registration lifecycle — re-renders when a connector with that id is registered (via AppKit's constructor or {@link appkit:addConnector}) or unregistered. Returns the matching {@link appkit:Connector}, or `undefined` when none with that id is currently registered. Use {@link useConnectedWallets} if you want to react to wallet connect/disconnect events instead.
 *
 * @param id - ID of the connector to look up.
 * @returns The matching {@link appkit:Connector}, or `undefined` if none with that id is registered.
 *
 * @public
 * @category Hook
 * @section Connectors
 */
export const useConnectorById = (id: string): Connector | undefined => {
    const appKit = useAppKit();

    const subscribe = useCallback(
        (onChange: () => void) => {
            return watchConnectorById(appKit, { id, onChange });
        },
        [appKit, id],
    );

    const getSnapshot = useCallback(() => {
        return getConnectorById(appKit, { id });
    }, [appKit, id]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
