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

/**
 * Return type of {@link useCryptoOnrampProvider} — the matching {@link CryptoOnrampProviderInterface}, or `undefined` when none is registered (the hook swallows the throw from {@link getCryptoOnrampProvider}).
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type UseCryptoOnrampProviderReturnType = GetCryptoOnrampProviderReturnType | undefined;

/**
 * Read a registered crypto-onramp provider by id, or the default provider when no id is given — subscribes to {@link watchCryptoOnrampProviders} and re-reads via {@link getCryptoOnrampProvider} so the result stays in sync. The read swallows the throw from {@link getCryptoOnrampProvider} (which throws when no provider matches — or when no id is passed and no default has been registered) and yields `undefined` instead.
 *
 * @param options - {@link GetCryptoOnrampProviderOptions} Optional provider id.
 * @returns The matching provider, or `undefined` when none is registered.
 *
 * @public
 * @category Hook
 * @section Crypto Onramp
 */
export const useCryptoOnrampProvider = (
    options: GetCryptoOnrampProviderOptions = {},
): UseCryptoOnrampProviderReturnType => {
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
