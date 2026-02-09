/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MutateOptions, MutationOptions } from '@tanstack/query-core';

import { signCell } from '../../actions/signing/sign-cell';
import type { SignCellParameters, SignCellReturnType } from '../../actions/signing/sign-cell';
import type { AppKit } from '../../core/app-kit';
import type { MutationParameter } from '../../types/query';
import type { Compute } from '../../types/utils';

export type SignCellErrorType = Error;

export type SignCellOptions<context = unknown> = MutationParameter<
    SignCellData,
    SignCellErrorType,
    SignCellVariables,
    context
>;

export const signCellMutationOptions = <context = unknown>(
    appKit: AppKit,
    options: SignCellOptions<context> = {},
): SignCellMutationOptions<context> => {
    return {
        ...options.mutation,
        mutationFn(variables) {
            return signCell(appKit, variables);
        },
        mutationKey: ['signCell'],
    };
};

export type SignCellMutationOptions<context = unknown> = MutationOptions<
    SignCellData,
    SignCellErrorType,
    SignCellVariables,
    context
>;

export type SignCellData = Compute<SignCellReturnType>;

export type SignCellVariables = SignCellParameters;

export type SignCellMutate<context = unknown> = (
    variables: SignCellVariables,
    options?: Compute<MutateOptions<SignCellData, SignCellErrorType, Compute<SignCellVariables>, context>> | undefined,
) => void;

export type SignCellMutateAsync<context = unknown> = (
    variables: SignCellVariables,
    options?: Compute<MutateOptions<SignCellData, SignCellErrorType, Compute<SignCellVariables>, context>> | undefined,
) => Promise<SignCellData>;
