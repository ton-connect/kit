/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { getOnrampProvider, watchOnrampProviders } from '@ton/appkit/onramp';
import type { GetOnrampProviderOptions, GetOnrampProviderReturnType } from '@ton/appkit/onramp';

import { useAppKit } from '../../settings/hooks/use-app-kit';

export type UseOnrampProviderReturnType = GetOnrampProviderReturnType;

/**
 * Hook to get onramp provider
 */
export const useOnrampProvider = (options: GetOnrampProviderOptions = {}): UseOnrampProviderReturnType | undefined => {
    const appKit = useAppKit();
    const { id } = options;

    const subscribe = useCallback(
        (onChange: () => void) => {
            return watchOnrampProviders(appKit, { onChange });
        },
        [appKit],
    );

    const getSnapshot = useCallback(() => {
        try {
            return getOnrampProvider(appKit, { id });
        } catch {
            return undefined;
        }
    }, [appKit, id]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
