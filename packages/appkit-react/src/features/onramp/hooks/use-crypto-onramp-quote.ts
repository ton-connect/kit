/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import { getCryptoOnrampQuoteQueryOptions } from '@ton/appkit/queries';
import type {
    GetCryptoOnrampQuoteData,
    GetCryptoOnrampQuoteErrorType,
    GetCryptoOnrampQuoteQueryConfig,
} from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

export type UseCryptoOnrampQuoteParameters<selectData = GetCryptoOnrampQuoteData> =
    GetCryptoOnrampQuoteQueryConfig<selectData>;

export type UseCryptoOnrampQuoteReturnType<selectData = GetCryptoOnrampQuoteData> = UseQueryReturnType<
    selectData,
    GetCryptoOnrampQuoteErrorType
>;

/**
 * Hook to get a crypto onramp quote
 */
export const useCryptoOnrampQuote = <selectData = GetCryptoOnrampQuoteData>(
    parameters: UseCryptoOnrampQuoteParameters<selectData> = {},
): UseCryptoOnrampQuoteReturnType<selectData> => {
    const appKit = useAppKit();

    return useQuery(getCryptoOnrampQuoteQueryOptions(appKit, parameters));
};
