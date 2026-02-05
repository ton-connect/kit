/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import type { MutateFunction, MutateOptions } from '@tanstack/react-query';
import { buildSwapTransaction } from '@ton/appkit';
import type { BuildSwapTransactionData, BuildSwapTransactionVariables } from '@ton/appkit';

import { useMutation } from '../../../libs/query';
import type { UseMutationParameters, UseMutationReturnType } from '../../../libs/query';
import { useAppKit } from '../../../hooks/use-app-kit';

export type UseBuildSwapTransactionParameters<context = unknown> = UseMutationParameters<
    BuildSwapTransactionData,
    Error,
    BuildSwapTransactionVariables,
    context
>;

export type UseBuildSwapTransactionReturnType<context = unknown> = UseMutationReturnType<
    BuildSwapTransactionData,
    Error,
    BuildSwapTransactionVariables,
    context,
    (
        variables: BuildSwapTransactionVariables,
        options?: MutateOptions<BuildSwapTransactionData, Error, BuildSwapTransactionVariables, context>,
    ) => void,
    MutateFunction<BuildSwapTransactionData, Error, BuildSwapTransactionVariables, context>
>;

export const useBuildSwapTransaction = <context = unknown>(
    parameters?: UseBuildSwapTransactionParameters<context>,
): UseBuildSwapTransactionReturnType<context> => {
    const appKit = useAppKit();

    return useMutation({
        mutationFn: (variables) => buildSwapTransaction(appKit, variables),
        ...parameters,
    });
};
