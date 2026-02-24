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
import { useAppKit } from '../../../hooks/use-app-kit';

export type UseSendTransactionParameters<context = unknown> = SendTransactionOptions<context>;

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

export const useSendTransaction = <context = unknown>(
    parameters: UseSendTransactionParameters<context> = {},
): UseSendTransactionReturnType<context> => {
    const appKit = useAppKit();

    return useMutation(sendTransactionMutationOptions(appKit, parameters));
};
