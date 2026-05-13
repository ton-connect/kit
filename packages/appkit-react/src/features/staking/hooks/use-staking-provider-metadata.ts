/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStakingProviderMetadata, resolveNetwork } from '@ton/appkit';
import type { GetStakingProviderMetadataOptions, GetStakingProviderMetadataReturnType } from '@ton/appkit';
import { useMemo } from 'react';

import { useAppKit } from '../../settings';
import { useStakingProvider } from './use-staking-provider';

/**
 * Parameters accepted by {@link useStakingProviderMetadata} — optional `providerId` and network override.
 *
 * @public
 * @category Type
 * @section Staking
 */
export type UseStakingProviderMetadataParameters = GetStakingProviderMetadataOptions;

/**
 * Return type of {@link useStakingProviderMetadata} — static {@link appkit:StakingProviderMetadata} for the resolved provider, or `undefined` when no provider matches and no default is registered (the hook swallows the throw from {@link appkit:getStakingProviderMetadata}).
 *
 * @public
 * @category Type
 * @section Staking
 */
export type UseStakingProviderMetadataReturnType = GetStakingProviderMetadataReturnType | undefined;

/**
 * Read static metadata for a staking provider — display name, stake/receive tokens, supported unstake modes and contract address. Returns `undefined` when no provider matches and no default is registered. Use {@link useStakingProviderInfo} for live values (APY, instant-unstake liquidity, exchange rate). Defaults to the selected wallet's network; if no wallet is selected, falls back to AppKit's default network, or mainnet when none is set.
 *
 * @param parameters - {@link UseStakingProviderMetadataParameters} Optional `providerId` and network override.
 * @returns Static {@link appkit:StakingProviderMetadata}, or `undefined` when the provider can't be resolved.
 *
 * @public
 * @category Hook
 * @section Staking
 */
export const useStakingProviderMetadata = (parameters: UseStakingProviderMetadataParameters = {}) => {
    const appKit = useAppKit();
    const provider = useStakingProvider({ id: parameters.providerId });
    const network = resolveNetwork(appKit, parameters.network);

    return useMemo(() => {
        try {
            return getStakingProviderMetadata(appKit, { ...parameters, network });
        } catch {
            return undefined;
        }
    }, [appKit, network, parameters.providerId, provider?.providerId]);
};
