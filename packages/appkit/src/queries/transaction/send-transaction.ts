/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MutateOptions, MutationOptions } from '@tanstack/query-core';

import { sendTransaction } from '../../actions/transaction/send-transaction';
import type {
    SendTransactionErrorType,
    SendTransactionParameters,
    SendTransactionReturnType,
} from '../../actions/transaction/send-transaction';
import type { AppKit } from '../../core/app-kit';
import type { MutationParameter } from '../../types/query';
import type { Compute } from '../../types/utils';

export type SendTransactionOptions<context = unknown> = MutationParameter<
    SendTransactionData,
    SendTransactionErrorType,
    SendTransactionVariables,
    context
>;

export function sendTransactionMutationOptions<context = unknown>(
    appKit: AppKit,
    options: SendTransactionOptions<context> = {},
): SendTransactionMutationOptions<context> {
    return {
        ...options.mutation,
        mutationFn(variables) {
            return sendTransaction(appKit, variables);
        },
        mutationKey: ['sendTransaction'],
    };
}

export type SendTransactionMutationOptions<context = unknown> = MutationOptions<
    SendTransactionData,
    SendTransactionErrorType,
    SendTransactionVariables,
    context
>;

export type SendTransactionData = Compute<SendTransactionReturnType>;

export type SendTransactionVariables = SendTransactionParameters;

export type SendTransactionMutate<context = unknown> = (
    variables: SendTransactionVariables,
    options?:
        | Compute<
              MutateOptions<SendTransactionData, SendTransactionErrorType, Compute<SendTransactionVariables>, context>
          >
        | undefined,
) => void;

export type SendTransactionMutateAsync<context = unknown> = (
    variables: SendTransactionVariables,
    options?:
        | Compute<
              MutateOptions<SendTransactionData, SendTransactionErrorType, Compute<SendTransactionVariables>, context>
          >
        | undefined,
) => Promise<SendTransactionData>;
