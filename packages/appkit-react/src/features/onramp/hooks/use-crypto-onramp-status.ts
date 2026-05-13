/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import { getCryptoOnrampStatusQueryOptions } from '@ton/appkit/queries';
import type {
    GetCryptoOnrampStatusData,
    GetCryptoOnrampStatusErrorType,
    GetCryptoOnrampStatusQueryConfig,
} from '@ton/appkit/queries';

import { useAppKit } from '../../settings';
import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';

/**
 * Parameters accepted by {@link useCryptoOnrampStatus} — TanStack Query options (`select`, `enabled`, `refetchInterval`, …) plus the deposit id, originating provider id and optional provider override forwarded to {@link appkit:getCryptoOnrampStatus}.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type UseCryptoOnrampStatusParameters<selectData = GetCryptoOnrampStatusData> =
    GetCryptoOnrampStatusQueryConfig<selectData>;

/**
 * Return type of {@link useCryptoOnrampStatus} — TanStack Query result carrying `data`, `isLoading`, `error` and the standard companions.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type UseCryptoOnrampStatusReturnType<selectData = GetCryptoOnrampStatusData> = UseQueryReturnType<
    selectData,
    GetCryptoOnrampStatusErrorType
>;

/**
 * Read the current status of a crypto-onramp deposit previously created via {@link useCreateCryptoOnrampDeposit}. Typically polled via `refetchInterval` until `data` reaches a terminal state — `'success'` (delivered to the recipient) or `'failed'` (provider could not complete the deposit).
 *
 * @param parameters - {@link UseCryptoOnrampStatusParameters} Deposit id, originating provider id and TanStack Query overrides.
 * @expand parameters
 * @returns TanStack Query result for the status read.
 *
 * @public
 * @category Hook
 * @section Crypto Onramp
 */
export const useCryptoOnrampStatus = <selectData = GetCryptoOnrampStatusData>(
    parameters: UseCryptoOnrampStatusParameters<selectData> = {},
): UseCryptoOnrampStatusReturnType<selectData> => {
    const appKit = useAppKit();

    return useQuery(getCryptoOnrampStatusQueryOptions(appKit, parameters));
};
