/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { getCryptoOnrampProviders, watchCryptoOnrampProviders } from '@ton/appkit';
import type { GetCryptoOnrampProvidersReturnType } from '@ton/appkit';

import { useAppKit } from '../../settings/hooks/use-app-kit';

export type UseCryptoOnrampProvidersReturnType = GetCryptoOnrampProvidersReturnType;

/**
 * Hook to get all registered crypto-onramp providers.
 */
export const useCryptoOnrampProviders = (): UseCryptoOnrampProvidersReturnType => {
    const appKit = useAppKit();

    const subscribe = useCallback(
        (onChange: () => void) => {
            return watchCryptoOnrampProviders(appKit, { onChange });
        },
        [appKit],
    );

    const getSnapshot = useCallback(() => {
        return getCryptoOnrampProviders(appKit);
    }, [appKit]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
