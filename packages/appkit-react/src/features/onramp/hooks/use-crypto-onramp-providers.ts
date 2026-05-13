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

/**
 * Return type of {@link useCryptoOnrampProviders} — array of every {@link appkit:CryptoOnrampProviderInterface} currently registered on the AppKit instance.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type UseCryptoOnrampProvidersReturnType = GetCryptoOnrampProvidersReturnType;

/**
 * List every crypto-onramp provider registered on the AppKit instance (both those passed via {@link appkit:AppKitConfig}'s `providers` and those added later through {@link appkit:registerProvider}). Subscribes to {@link appkit:watchCryptoOnrampProviders} and re-reads via {@link appkit:getCryptoOnrampProviders} so the array stays in sync.
 *
 * @returns Array of registered crypto-onramp providers.
 *
 * @public
 * @category Hook
 * @section Crypto Onramp
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
