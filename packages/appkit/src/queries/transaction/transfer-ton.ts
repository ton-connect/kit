/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MutateOptions, MutationOptions } from '@tanstack/query-core';

import { transferTon } from '../../actions/transaction/transfer-ton';
import type {
    TransferTonErrorType,
    TransferTonParameters,
    TransferTonReturnType,
} from '../../actions/transaction/transfer-ton';
import type { AppKit } from '../../core/app-kit';
import type { MutationParameter } from '../../types/query';
import type { Compute } from '../../types/utils';

export type { TransferTonErrorType, TransferTonParameters, TransferTonReturnType };

export type TransferTonOptions<context = unknown> = MutationParameter<
    TransferTonData,
    TransferTonErrorType,
    TransferTonVariables,
    context
>;

export const transferTonMutationOptions = <context = unknown>(
    appKit: AppKit,
    options: TransferTonOptions<context> = {},
): TransferTonMutationOptions<context> => {
    return {
        ...options.mutation,
        mutationFn(variables) {
            return transferTon(appKit, variables);
        },
        mutationKey: ['transferTon'],
    };
};

export type TransferTonMutationOptions<context = unknown> = MutationOptions<
    TransferTonData,
    TransferTonErrorType,
    TransferTonVariables,
    context
>;

export type TransferTonData = Compute<TransferTonReturnType>;

export type TransferTonVariables = TransferTonParameters;

export type TransferTonMutate<context = unknown> = (
    variables: TransferTonVariables,
    options?:
        | Compute<MutateOptions<TransferTonData, TransferTonErrorType, Compute<TransferTonVariables>, context>>
        | undefined,
) => void;

export type TransferTonMutateAsync<context = unknown> = (
    variables: TransferTonVariables,
    options?:
        | Compute<MutateOptions<TransferTonData, TransferTonErrorType, Compute<TransferTonVariables>, context>>
        | undefined,
) => Promise<TransferTonData>;
