/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStakingProviderMetadata } from '@ton/appkit';
import type { GetStakingProviderMetadataOptions, GetStakingProviderMetadataReturnType } from '@ton/appkit';
import { useMemo } from 'react';

import { useAppKit } from '../../settings';
import { useStakingProvider } from './use-staking-provider';

export type UseStakingProviderMetadataParameters = GetStakingProviderMetadataOptions;
export type UseStakingProviderMetadataReturnType = GetStakingProviderMetadataReturnType;

/**
 * Hook to get static staking provider metadata
 */
export const useStakingProviderMetadata = (parameters: UseStakingProviderMetadataParameters = {}) => {
    const appKit = useAppKit();
    const provider = useStakingProvider({ id: parameters.providerId });

    return useMemo(() => {
        try {
            return getStakingProviderMetadata(appKit, parameters);
        } catch {
            return undefined;
        }
    }, [appKit, parameters.network, parameters.providerId, provider?.providerId]);
};
