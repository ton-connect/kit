/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MutateOptions, MutationOptions } from '@tanstack/query-core';

import { transferJetton } from '../../actions/jettons/transfer-jetton';
import type { TransferJettonParameters, TransferJettonReturnType } from '../../actions/jettons/transfer-jetton';
import type { AppKit } from '../../core/app-kit';
import type { MutationParameter } from '../../types/query';
import type { Compute } from '../../types/utils';

export type { TransferJettonParameters, TransferJettonReturnType };

export type TransferJettonErrorType = Error;

export type TransferJettonOptions<context = unknown> = MutationParameter<
    TransferJettonData,
    TransferJettonErrorType,
    TransferJettonVariables,
    context
>;

export const transferJettonMutationOptions = <context = unknown>(
    appKit: AppKit,
    options: TransferJettonOptions<context> = {},
): TransferJettonMutationOptions<context> => {
    return {
        ...options.mutation,
        mutationFn(variables) {
            return transferJetton(appKit, variables);
        },
        mutationKey: ['transferJetton'],
    };
};

export type TransferJettonMutationOptions<context = unknown> = MutationOptions<
    TransferJettonData,
    TransferJettonErrorType,
    TransferJettonVariables,
    context
>;

export type TransferJettonData = Compute<TransferJettonReturnType>;

export type TransferJettonVariables = TransferJettonParameters;

export type TransferJettonMutate<context = unknown> = (
    variables: TransferJettonVariables,
    options?:
        | Compute<MutateOptions<TransferJettonData, TransferJettonErrorType, Compute<TransferJettonVariables>, context>>
        | undefined,
) => void;

export type TransferJettonMutateAsync<context = unknown> = (
    variables: TransferJettonVariables,
    options?:
        | Compute<MutateOptions<TransferJettonData, TransferJettonErrorType, Compute<TransferJettonVariables>, context>>
        | undefined,
) => Promise<TransferJettonData>;
