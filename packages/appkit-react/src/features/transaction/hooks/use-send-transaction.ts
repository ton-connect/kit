/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import type { MutateFunction, MutateOptions } from '@tanstack/react-query';
import type {
    SendTransactionData,
    SendTransactionErrorType,
    SendTransactionOptions,
    SendTransactionVariables,
} from '@ton/appkit/queries';
import { sendTransactionMutationOptions } from '@ton/appkit/queries';

import { useMutation } from '../../../libs/query';
import type { UseMutationReturnType } from '../../../libs/query';
import { useAppKit } from '../../settings';

/**
 * Parameters accepted by {@link useSendTransaction} — TanStack Query mutation options.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export type UseSendTransactionParameters<context = unknown> = SendTransactionOptions<context>;

/**
 * Return type of {@link useSendTransaction} — TanStack Query mutation result.
 *
 * @public
 * @category Type
 * @section Transactions
 */
export type UseSendTransactionReturnType<context = unknown> = UseMutationReturnType<
    SendTransactionData,
    SendTransactionErrorType,
    SendTransactionVariables,
    context,
    (
        variables: SendTransactionVariables,
        options?: MutateOptions<SendTransactionData, SendTransactionErrorType, SendTransactionVariables, context>,
    ) => void,
    MutateFunction<SendTransactionData, SendTransactionErrorType, SendTransactionVariables, context>
>;

/**
 * React mutation hook that hands a pre-built {@link TransactionRequest} to the selected wallet for signing and broadcast (wraps {@link sendTransaction}); returns `mutate(request)`.
 *
 * @param parameters - {@link UseSendTransactionParameters} TanStack Query mutation overrides.
 * @returns Mutation result for the send call.
 *
 * @public
 * @category Hook
 * @section Transactions
 */
export const useSendTransaction = <context = unknown>(
    parameters: UseSendTransactionParameters<context> = {},
): UseSendTransactionReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(sendTransactionMutationOptions(appKit, parameters));
};
