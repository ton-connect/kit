/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSyncExternalStore, useCallback } from 'react';
import { getStakingProvider, watchStakingProviders } from '@ton/appkit';
import type { GetStakingProviderOptions, GetStakingProviderReturnType } from '@ton/appkit';

import { useAppKit } from '../../settings/hooks/use-app-kit';

/**
 * Return type of {@link useStakingProvider} — the matching staking provider, or `undefined` when none resolves (the hook swallows the throw from {@link appkit:getStakingProvider}).
 *
 * @public
 * @category Type
 * @section Staking
 */
export type UseStakingProviderReturnType = GetStakingProviderReturnType | undefined;

/**
 * React hook returning a registered staking provider; subscribes to provider-registry changes via {@link appkit:watchStakingProviders} and looks up by `id`, or returns the registered default when no id is given. Returns `undefined` when no provider matches and no default has been registered (where the underlying {@link appkit:getStakingProvider} action would throw).
 *
 * @param options - Optional provider `id`.
 * @returns Matching staking provider instance, or `undefined` when none resolves.
 *
 * @public
 * @category Hook
 * @section Staking
 */
export const useStakingProvider = (options: GetStakingProviderOptions = {}): UseStakingProviderReturnType => {
    const appKit = useAppKit();
    const { id } = options;

    const subscribe = useCallback(
        (onChange: () => void) => {
            return watchStakingProviders(appKit, { onChange });
        },
        [appKit],
    );

    const getSnapshot = useCallback(() => {
        try {
            return getStakingProvider(appKit, { id });
        } catch {
            return undefined;
        }
    }, [appKit, id]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
