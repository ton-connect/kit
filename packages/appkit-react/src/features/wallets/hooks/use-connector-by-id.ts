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
 * Read a connector by id (wraps {@link appkit:getConnectorById} + {@link appkit:watchConnectorById}); re-renders when the connector with that id is registered or unregistered (use {@link useConnectedWallets} to react to wallet connect/disconnect events).
 *
 * @param id - Id of the connector to look up.
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
