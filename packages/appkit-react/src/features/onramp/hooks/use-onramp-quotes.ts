/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import { getOnrampQuotesQueryOptions } from '@ton/appkit/queries';
import type { GetOnrampQuotesData, GetOnrampQuotesErrorType, GetOnrampQuotesQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseOnrampQuotesParameters<selectData = GetOnrampQuotesData> = GetOnrampQuotesQueryConfig<selectData>;

export type UseOnrampQuotesReturnType<selectData = GetOnrampQuotesData> = UseQueryReturnType<
    selectData,
    GetOnrampQuotesErrorType
>;

/**
 * Hook to get onramp quotes from all registered providers (results are flattened).
 */
export const useOnrampQuotes = <selectData = GetOnrampQuotesData>(
    parameters: UseOnrampQuotesParameters<selectData> = {},
): UseOnrampQuotesReturnType<selectData> => {
    const appKit = useAppKit();

    return useQuery(getOnrampQuotesQueryOptions(appKit, parameters));
};
