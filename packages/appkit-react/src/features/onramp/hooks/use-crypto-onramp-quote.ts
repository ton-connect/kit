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

/**
 * Parameters accepted by {@link useCryptoOnrampQuote} — TanStack Query options (`select`, `enabled`, `staleTime`, …) plus the source/target assets, amount and optional provider override forwarded to {@link appkit:getCryptoOnrampQuote}.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type UseCryptoOnrampQuoteParameters<selectData = GetCryptoOnrampQuoteData> =
    GetCryptoOnrampQuoteQueryConfig<selectData>;

/**
 * Return type of {@link useCryptoOnrampQuote} — TanStack Query result carrying `data`, `isLoading`, `error` and the standard companions.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type UseCryptoOnrampQuoteReturnType<selectData = GetCryptoOnrampQuoteData> = UseQueryReturnType<
    selectData,
    GetCryptoOnrampQuoteErrorType
>;

/**
 * Quote a crypto-to-TON onramp — given a source asset/chain and the target TON asset, returns the rate, expected amount and the provider-specific metadata required to feed {@link useCreateCryptoOnrampDeposit}. `data` is the {@link appkit:CryptoOnrampQuote} payload.
 *
 * @param parameters - {@link UseCryptoOnrampQuoteParameters} Quote inputs and TanStack Query overrides.
 * @returns TanStack Query result for the quote read.
 *
 * @public
 * @category Hook
 * @section Crypto Onramp
 */
export const useCryptoOnrampQuote = <selectData = GetCryptoOnrampQuoteData>(
    parameters: UseCryptoOnrampQuoteParameters<selectData> = {},
): UseCryptoOnrampQuoteReturnType<selectData> => {
    const appKit = useAppKit();

    return useQuery(getCryptoOnrampQuoteQueryOptions(appKit, parameters));
};
