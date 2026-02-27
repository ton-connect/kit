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
import { useAppKit } from '../../../hooks/use-app-kit';

export type UseTransactionStatusParameters<selectData = GetTransactionStatusData> = GetTransactionStatusParameters &
    GetTransactionStatusQueryConfig<selectData>;

export type UseTransactionStatusReturnType<selectData = GetTransactionStatusData> = UseQueryReturnType<
    selectData,
    GetTransactionStatusErrorType
>;

/**
 * Hook to get the status of a transaction trace by BOC.
 *
 * This hook polls the toncenter API to track the progress of a transaction trace.
 * It is useful for tracking complex operations like swaps or multi-step flows.
 *
 * @example
 * ```ts
 * const { data: status } = useTransactionStatus({
 *   boc: 'te6cc...',
 *   query: {
 *     refetchInterval: 2000, // Poll every 2 seconds
 *   }
 * });
 *
 * if (status?.status === 'pending') {
 *   console.log(`Progress: ${status.completedMessages}/${status.totalMessages}`);
 * }
 * ```
 */
export const useTransactionStatus = <selectData = GetTransactionStatusData>(
    parameters: UseTransactionStatusParameters<selectData>,
): UseTransactionStatusReturnType<selectData> => {
    const appKit = useAppKit();

    return useQuery(getTransactionStatusQueryOptions(appKit, parameters));
};
