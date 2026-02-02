/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import type { MutateFunction, MutateOptions } from '@tanstack/react-query';
import { sendTransaction } from '@ton/appkit';
import type { SendTransactionParameters, SendTransactionReturnType } from '@ton/appkit';

import { useMutation } from '../../../libs/query';
import type { UseMutationParameters, UseMutationReturnType } from '../../../libs/query';
import { useAppKit } from '../../../hooks/use-app-kit';

export type UseSendTransactionParameters<context = unknown> = UseMutationParameters<
    SendTransactionReturnType,
    Error,
    SendTransactionParameters,
    context
>;

export type UseSendTransactionReturnType<context = unknown> = UseMutationReturnType<
    SendTransactionReturnType,
    Error,
    SendTransactionParameters,
    context,
    (
        variables: SendTransactionParameters,
        options?: MutateOptions<SendTransactionReturnType, Error, SendTransactionParameters, context>,
    ) => void,
    MutateFunction<SendTransactionReturnType, Error, SendTransactionParameters, context>
>;

export function useSendTransaction<context = unknown>(
    parameters?: UseSendTransactionParameters<context>,
): UseSendTransactionReturnType<context> {
    const appKit = useAppKit();

    return useMutation({
        mutationFn: (variables) => sendTransaction(appKit, variables),
        ...parameters,
    });
}
