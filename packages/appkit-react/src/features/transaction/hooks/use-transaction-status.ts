/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    GetTransactionStatusData,
    GetTransactionStatusErrorType,
    GetTransactionStatusParameters,
    GetTransactionStatusQueryConfig,
} from '@ton/appkit/queries';
import { getTransactionStatusQueryOptions } from '@ton/appkit/queries';

import { useQuery } from '../../../libs/query';
import type { UseQueryReturnType } from '../../../libs/query';
import { useAppKit } from '../../settings';
import { useNetwork } from '../../network';

/**
 * Parameters accepted by {@link useTransactionStatus} — `boc` xor `normalizedHash` plus optional network and TanStack Query overrides. Pair with `query.refetchInterval` to poll until the transaction completes.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export type UseTransactionStatusParameters<selectData = GetTransactionStatusData> = GetTransactionStatusParameters &
    GetTransactionStatusQueryConfig<selectData>;

/**
 * Return type of {@link useTransactionStatus} — TanStack Query result for the status read.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export type UseTransactionStatusReturnType<selectData = GetTransactionStatusData> = UseQueryReturnType<
    selectData,
    GetTransactionStatusErrorType
>;

/**
 * Poll the status of a sent transaction by its BoC or normalized hash. In TON a single external message triggers a tree of internal messages, so the transaction is `'completed'` only once the entire trace finishes — pair with `refetchInterval` to keep polling until `data.status` is `'completed'` or `'failed'`. Pass either `boc` or `normalizedHash` (not both). The underlying action throws `Error('Either boc or normalizedHash must be provided')` when neither is supplied — TanStack Query surfaces it via the query's `error`.
 *
 * @param parameters - {@link UseTransactionStatusParameters} `boc` xor `normalizedHash`, optional network and TanStack Query overrides.
 * @returns TanStack Query result for the status read.
 *
 * @public
 * @category Hook
 * @section Transactions
 */
export const useTransactionStatus = <selectData = GetTransactionStatusData>(
    parameters: UseTransactionStatusParameters<selectData>,
): UseTransactionStatusReturnType<selectData> => {
    const appKit = useAppKit();
    const walletNetwork = useNetwork();

    return useQuery(
        getTransactionStatusQueryOptions(appKit, { ...parameters, network: parameters.network ?? walletNetwork }),
    );
};
