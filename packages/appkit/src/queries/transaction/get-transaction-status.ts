/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getTransactionStatus } from '../../actions/transaction/get-transaction-status';
import type {
    GetTransactionStatusErrorType,
    GetTransactionStatusParameters,
    GetTransactionStatusReturnType,
} from '../../actions/transaction/get-transaction-status';
import type { AppKit } from '../../core/app-kit';
import type { QueryOptions, QueryParameter } from '../../types/query';
import type { Compute } from '../../types/utils';

export type { GetTransactionStatusErrorType, GetTransactionStatusParameters, GetTransactionStatusReturnType };

export type GetTransactionStatusData = Compute<GetTransactionStatusReturnType>;

export type GetTransactionStatusQueryKey = readonly ['transactionStatus', string];

export type GetTransactionStatusQueryConfig<selectData = GetTransactionStatusData> = QueryParameter<
    GetTransactionStatusData,
    GetTransactionStatusErrorType,
    selectData,
    GetTransactionStatusQueryKey
>;

export type GetTransactionStatusQueryOptions<selectData = GetTransactionStatusData> = QueryOptions<
    GetTransactionStatusData,
    GetTransactionStatusErrorType,
    selectData,
    GetTransactionStatusQueryKey
>;

export const getTransactionStatusQueryOptions = <selectData = GetTransactionStatusData>(
    appKit: AppKit,
    options: GetTransactionStatusParameters & GetTransactionStatusQueryConfig<selectData>,
): GetTransactionStatusQueryOptions<selectData> => {
    return {
        ...options.query,
        queryFn: () => {
            return getTransactionStatus(appKit, options);
        },
        queryKey: ['transactionStatus', (options.boc ?? options.normalizedHash) as string] as const,
    };
};
