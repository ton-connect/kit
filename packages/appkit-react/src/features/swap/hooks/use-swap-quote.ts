/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import { getSwapQuoteQueryOptions } from '@ton/appkit/queries';
import type { GetSwapQuoteData, GetSwapQuoteErrorType, GetSwapQuoteQueryConfig } from '@ton/appkit/queries';

import { useAppKit } from '../../../hooks/use-app-kit';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseSwapQuoteParameters<selectData = GetSwapQuoteData> = GetSwapQuoteQueryConfig<selectData>;

export type UseSwapQuoteReturnType<selectData = GetSwapQuoteData> = UseQueryReturnType<
    selectData,
    GetSwapQuoteErrorType
>;

export const useSwapQuote = <selectData = GetSwapQuoteData>(
    parameters: UseSwapQuoteParameters<selectData> = {},
): UseSwapQuoteReturnType<selectData> => {
    const appKit = useAppKit();

    return useQuery(getSwapQuoteQueryOptions(appKit, parameters));
};
