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

import { useAppKit } from '../../../hooks/use-app-kit';

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
