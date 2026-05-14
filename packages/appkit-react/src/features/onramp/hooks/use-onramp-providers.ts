/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { getOnrampProviders, watchOnrampProviders } from '@ton/appkit/onramp';
import type { GetOnrampProvidersReturnType } from '@ton/appkit/onramp';

import { useAppKit } from '../../settings/hooks/use-app-kit';

export type UseOnrampProvidersReturnType = GetOnrampProvidersReturnType;

/**
 * React hook that lists every onramp provider registered on the AppKit instance. Subscribes via `watchOnrampProviders` so the array stays in sync. Internal: not part of the public API yet (fiat onramp is WIP). */
export const useOnrampProviders = (): UseOnrampProvidersReturnType => {
    const appKit = useAppKit();

    const subscribe = useCallback(
        (onChange: () => void) => {
            return watchOnrampProviders(appKit, { onChange });
        },
        [appKit],
    );

    const getSnapshot = useCallback(() => {
        return getOnrampProviders(appKit);
    }, [appKit]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
