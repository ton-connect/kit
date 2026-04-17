/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { getOnrampProviders, watchOnrampProviders } from '@ton/appkit';
import type { GetOnrampProvidersReturnType } from '@ton/appkit';

import { useAppKit } from '../../settings/hooks/use-app-kit';

export type UseOnrampProvidersReturnType = GetOnrampProvidersReturnType;

/**
 * Hook to get all registered onramp providers
 */
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
