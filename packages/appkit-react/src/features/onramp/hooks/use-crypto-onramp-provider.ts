/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { getCryptoOnrampProvider, watchCryptoOnrampProviders } from '@ton/appkit';
import type { GetCryptoOnrampProviderOptions, GetCryptoOnrampProviderReturnType } from '@ton/appkit';

import { useAppKit } from '../../settings/hooks/use-app-kit';

export type UseCryptoOnrampProviderReturnType = GetCryptoOnrampProviderReturnType;

/**
 * Hook to get a registered crypto-onramp provider by id, or the default one when no id is given.
 */
export const useCryptoOnrampProvider = (
    options: GetCryptoOnrampProviderOptions = {},
): UseCryptoOnrampProviderReturnType | undefined => {
    const appKit = useAppKit();
    const { id } = options;

    const subscribe = useCallback(
        (onChange: () => void) => {
            return watchCryptoOnrampProviders(appKit, { onChange });
        },
        [appKit],
    );

    const getSnapshot = useCallback(() => {
        try {
            return getCryptoOnrampProvider(appKit, { id });
        } catch {
            return undefined;
        }
    }, [appKit, id]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
