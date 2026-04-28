/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MutationOptions } from '@tanstack/query-core';

import { sendGaslessTransaction } from '../../actions/gasless/send-gasless-transaction';
import type {
    SendGaslessTransactionErrorType,
    SendGaslessTransactionParameters,
    SendGaslessTransactionReturnType,
} from '../../actions/gasless/send-gasless-transaction';
import type { AppKit } from '../../core/app-kit';
import type { MutationParameter } from '../../types/query';
import type { Compute } from '../../types/utils';

export type { SendGaslessTransactionErrorType };

export type SendGaslessTransactionMutationConfig<context = unknown> = MutationParameter<
    SendGaslessTransactionData,
    SendGaslessTransactionErrorType,
    SendGaslessTransactionVariables,
    context
>;

export const sendGaslessTransactionMutationOptions = <context = unknown>(
    appKit: AppKit,
    config: SendGaslessTransactionMutationConfig<context> = {},
): SendGaslessTransactionMutationOptions<context> => {
    return {
        ...config.mutation,
        mutationFn: (variables: SendGaslessTransactionVariables) => sendGaslessTransaction(appKit, variables),
        mutationKey: ['sendGaslessTransaction'],
    };
};

export type SendGaslessTransactionVariables = Compute<SendGaslessTransactionParameters>;

export type SendGaslessTransactionData = Compute<Awaited<SendGaslessTransactionReturnType>>;

export type SendGaslessTransactionMutate<context = unknown> = (
    variables: SendGaslessTransactionVariables,
    options?: MutationOptions<
        SendGaslessTransactionData,
        SendGaslessTransactionErrorType,
        SendGaslessTransactionVariables,
        context
    >,
) => void;

export type SendGaslessTransactionMutateAsync<context = unknown> = (
    variables: SendGaslessTransactionVariables,
    options?: MutationOptions<
        SendGaslessTransactionData,
        SendGaslessTransactionErrorType,
        SendGaslessTransactionVariables,
        context
    >,
) => Promise<SendGaslessTransactionData>;

export type SendGaslessTransactionMutationOptions<context = unknown> = MutationOptions<
    SendGaslessTransactionData,
    SendGaslessTransactionErrorType,
    SendGaslessTransactionVariables,
    context
>;
