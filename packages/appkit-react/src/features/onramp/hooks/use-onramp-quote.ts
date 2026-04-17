/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import { getOnrampQuoteQueryOptions } from '@ton/appkit/queries';
import type { GetOnrampQuoteData, GetOnrampQuoteErrorType, GetOnrampQuoteQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseOnrampQuoteParameters<selectData = GetOnrampQuoteData> = GetOnrampQuoteQueryConfig<selectData>;

export type UseOnrampQuoteReturnType<selectData = GetOnrampQuoteData> = UseQueryReturnType<
    selectData,
    GetOnrampQuoteErrorType
>;

/**
 * Hook to get onramp quote
 */
export const useOnrampQuote = <selectData = GetOnrampQuoteData>(
    parameters: UseOnrampQuoteParameters<selectData> = {},
): UseOnrampQuoteReturnType<selectData> => {
    const appKit = useAppKit();

    return useQuery(getOnrampQuoteQueryOptions(appKit, parameters));
};
