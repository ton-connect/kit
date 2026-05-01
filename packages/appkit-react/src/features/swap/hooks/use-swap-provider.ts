/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { getSwapProvider, setDefaultSwapProvider, watchSwapProviders } from '@ton/appkit';
import type { GetSwapProviderReturnType } from '@ton/appkit';

import { useAppKit } from '../../settings/hooks/use-app-kit';

export type UseSwapProviderReturnType = readonly [GetSwapProviderReturnType | undefined, (providerId: string) => void];

/**
 * Hook to get and set the currently selected swap provider.
 * Mirrors the tuple shape of `useSelectedWallet`.
 */
export const useSwapProvider = (): UseSwapProviderReturnType => {
    const appKit = useAppKit();

    const subscribe = useCallback(
        (onChange: () => void) => {
            return watchSwapProviders(appKit, { onChange });
        },
        [appKit],
    );

    const getSnapshot = useCallback(() => {
        try {
            return getSwapProvider(appKit);
        } catch {
            return undefined;
        }
    }, [appKit]);

    const provider = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const setProviderId = useCallback(
        (providerId: string) => {
            setDefaultSwapProvider(appKit, { providerId });
        },
        [appKit],
    );

    return [provider, setProviderId] as const;
};
